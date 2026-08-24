// Global API: dataset listing, upload (with conversion), deletion.

import * as express from 'express';
import * as fs from 'fs';
import * as path from 'path';
import multer from 'multer';
import {
  DATA_ROOT, datasetDir, listDatasets, readMeta, deleteDataset, sanitizeId,
  ensureIndexes, countMeta, DatasetMeta,
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
    if (!sqliteFile || !prsmFile || !proteoformFile) {
      cleanupTmp();
      res.status(400).json({ error: 'sqlite, prsmXml and proteoformXml files are all required' });
      return;
    }
    if (!/\.(sqlite|db)$/i.test(sqliteFile.originalname)) {
      cleanupTmp();
      res.status(400).json({ error: 'the TopFD file must be a .sqlite/.db file' });
      return;
    }
    if (!/\.xml$/i.test(prsmFile.originalname) || !/\.xml$/i.test(proteoformFile.originalname)) {
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
    move(sqliteFile, 'ms.sqlite');
    move(prsmFile, 'prsm.xml');
    move(proteoformFile, 'proteoform.xml');
    if (fastaFile) move(fastaFile, 'db.fasta');

    try {
      ensureIndexes(path.join(dir, 'ms.sqlite'));
      // Parse, match and cache the dataset now: this validates the uploaded
      // files (all data_js files are then served dynamically from this cache).
      const source = getDatasetSource(id);
      if (!source) throw new Error('uploaded files could not be read');
      const counts = countMeta(path.join(dir, 'ms.sqlite'));
      const meta: DatasetMeta = {
        id,
        name: requested.replace(/\.(sqlite|db)$/i, ''),
        createdAt: new Date().toISOString(),
        prsmCount: source.all.length,
        proteoformCount: new Set(source.all.map((d) => d.prsm.proteoClusterId)).size,
        proteinCount: new Set(source.all.map((d) => d.prsm.protId)).size,
        ms1Count: counts.ms1Count,
        ms2Count: counts.ms2Count,
        hasFasta: !!fastaFile,
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
