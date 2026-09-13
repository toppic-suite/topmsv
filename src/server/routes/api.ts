// Global API: dataset listing, upload (with conversion), deletion.

import * as express from 'express';
import * as fs from 'fs';
import * as path from 'path';
import multer from 'multer';
import {
  DATA_ROOT, datasetDir, listDatasets, readMeta, deleteDataset, sanitizeId,
  ensureIndexes, has3dTables, countMeta, DatasetMeta, MS_DB_FILE,
} from '../datasets';
import { getDatasetSource, invalidatePrsmSource } from '../prsmSource';

const router = express.Router();

const TMP_DIR = path.join(DATA_ROOT, '.tmp_uploads');
fs.mkdirSync(TMP_DIR, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, TMP_DIR),
    filename: (req, file, cb) =>
      cb(null, Date.now() + '-' + Math.random().toString(36).slice(2) + '.tmp'),
  }),
  limits: { fileSize: 4 * 1024 * 1024 * 1024 },
});

router.get('/datasets', (req, res) => {
  res.json(listDatasets());
});

router.delete('/datasets/:id', (req, res) => {
  invalidatePrsmSource(req.params.id);
  if (deleteDataset(req.params.id)) res.json({ deleted: true });
  else res.status(404).json({ error: 'dataset not found' });
});

const uploadFields = upload.fields([
  { name: 'sqlite', maxCount: 1 },
  { name: 'prsmXml', maxCount: 1 },
  { name: 'proteoformXml', maxCount: 1 },
  { name: 'fasta', maxCount: 1 },
]);

router.post('/datasets', uploadFields, (req, res) => {
  const files = req.files as { [field: string]: Express.Multer.File[] } | undefined;
  const cleanupTmp = () => {
    for (const list of Object.values(files ?? {})) {
      for (const f of list) fs.rmSync(f.path, { force: true });
    }
  };
  try {
    const sqliteFile = files?.sqlite?.[0];
    const prsmFile = files?.prsmXml?.[0];
    const proteoformFile = files?.proteoformXml?.[0];
    const fastaFile = files?.fasta?.[0];
    if (!sqliteFile) {
      cleanupTmp();
      res.status(400).json({ error: 'the TopFD sqlite file is required' });
      return;
    }
    // The TopPIC XMLs are optional, but only as a pair: the proteoform XML
    // alone carries no PrSM data and the PrSM XML alone leaves the
    // proteoform-level cutoff undefined.
    if (!!prsmFile !== !!proteoformFile) {
      cleanupTmp();
      res.status(400).json({ error: 'the TopPIC PrSM XML and proteoform XML must be uploaded together (or both omitted)' });
      return;
    }
    const hasIdentifications = !!prsmFile && !!proteoformFile;
    if (!/\.(sqlite|db)$/i.test(sqliteFile.originalname)) {
      cleanupTmp();
      res.status(400).json({ error: 'the TopFD file must be a .sqlite/.db file' });
      return;
    }
    if (prsmFile && proteoformFile && (!/\.xml$/i.test(prsmFile.originalname) || !/\.xml$/i.test(proteoformFile.originalname))) {
      cleanupTmp();
      res.status(400).json({ error: 'the TopPIC result files must be .xml files' });
      return;
    }

    const requested = String(req.body.name || '').trim() || sqliteFile.originalname;
    let id = sanitizeId(requested);
    let dir = datasetDir(id);
    if (!dir) {
      cleanupTmp();
      res.status(400).json({ error: 'invalid dataset name' });
      return;
    }
    if (fs.existsSync(dir)) {
      // find a free suffix
      let n = 2;
      while (fs.existsSync(datasetDir(`${id}_${n}`)!)) n++;
      id = `${id}_${n}`;
      dir = datasetDir(id)!;
    }
    fs.mkdirSync(dir, { recursive: true });
    const move = (f: Express.Multer.File, name: string) => {
      fs.renameSync(f.path, path.join(dir!, name));
    };
    move(sqliteFile, MS_DB_FILE);
    if (prsmFile && proteoformFile) {
      move(prsmFile, 'prsm.xml');
      move(proteoformFile, 'proteoform.xml');
    }
    if (fastaFile) move(fastaFile, 'db.fasta');

    try {
      ensureIndexes(path.join(dir, MS_DB_FILE));
      // newer TopFD versions write the MS1 3D peak tables into the same file
      const has3d = has3dTables(path.join(dir, MS_DB_FILE));
      // Parse, match and cache the identifications now: this validates the
      // uploaded XMLs (all data_js files are then served dynamically from
      // this cache). Without XMLs the dataset only offers the raw spectra.
      const source = hasIdentifications ? getDatasetSource(id) : null;
      if (hasIdentifications && !source) throw new Error('uploaded files could not be read');
      const all = source ? source.all : [];
      const counts = countMeta(path.join(dir, MS_DB_FILE));
      const meta: DatasetMeta = {
        id,
        name: requested.replace(/\.(sqlite|db)$/i, ''),
        createdAt: new Date().toISOString(),
        hasIdentifications,
        prsmCount: all.length,
        proteoformCount: new Set(all.map((d) => d.prsm.proteoClusterId)).size,
        proteinCount: new Set(all.map((d) => d.prsm.protId)).size,
        ms1Count: counts.ms1Count,
        ms2Count: counts.ms2Count,
        hasFasta: !!fastaFile,
        has3d,
      };
      fs.writeFileSync(path.join(dir, 'meta.json'), JSON.stringify(meta, null, 2));
      res.json(meta);
    } catch (err) {
      invalidatePrsmSource(id);
      fs.rmSync(dir, { recursive: true, force: true });
      throw err;
    }
  } catch (err) {
    cleanupTmp();
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: 'conversion failed: ' + message });
  }
});

export default router;
