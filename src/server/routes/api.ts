// Global API: dataset listing, upload (with conversion), deletion.

import * as express from 'express';
import * as fs from 'fs';
import * as path from 'path';
import multer from 'multer';
import {
  DATA_ROOT, datasetDir, listDatasets, readMeta, deleteDataset, sanitizeId,
  ensureIndexes, inspectSqlite, countMeta, DatasetMeta, MS_DB_FILE,
} from '../datasets';
import { getDatasetSource, invalidatePrsmSource } from '../prsmSource';
import { APP_VERSION } from '../version';
import { serverConfig } from '../config';

const router = express.Router();

/** Refuse uploads and deletions when the server was started with
 *  view-only (for uploads this runs before multer, so no temporary file is
 *  written). */
function rejectWhenViewOnly(req: express.Request, res: express.Response, next: express.NextFunction): void {
  if (serverConfig.viewOnly) {
    res.status(403).json({ error: 'this server is view-only: uploads and deletions are disabled' });
    return;
  }
  next();
}

// Read by the home page: application version and whether the server is view-only.
router.get('/config', (req, res) => {
  res.json({ version: APP_VERSION, viewOnly: serverConfig.viewOnly });
});


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

router.delete('/datasets/:id', rejectWhenViewOnly, (req, res) => {
  invalidatePrsmSource(req.params.id);
  if (deleteDataset(req.params.id)) res.json({ deleted: true });
  else res.status(404).json({ error: 'dataset not found' });
});

const uploadFields = upload.fields([
  { name: 'sqlite', maxCount: 1 },
]);

router.post('/datasets', rejectWhenViewOnly, uploadFields, (req, res) => {
  const files = req.files as { [field: string]: Express.Multer.File[] } | undefined;
  const cleanupTmp = () => {
    for (const list of Object.values(files ?? {})) {
      for (const f of list) fs.rmSync(f.path, { force: true });
    }
  };
  try {
    const sqliteFile = files?.sqlite?.[0];
    if (!sqliteFile) {
      cleanupTmp();
      res.status(400).json({ error: 'the sqlite file is required' });
      return;
    }
    if (!/\.(sqlite|db)$/i.test(sqliteFile.originalname)) {
      cleanupTmp();
      res.status(400).json({ error: 'the file must be a .sqlite/.db file' });
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
    const sqlitePath = path.join(dir, MS_DB_FILE);
    fs.renameSync(sqliteFile.path, sqlitePath);

    try {
      ensureIndexes(sqlitePath);
      // TopPIC writes its identifications and the search database, and newer
      // TopFD versions the MS1 3D peak tables, into the same file
      const contents = inspectSqlite(sqlitePath);
      // Read, match and cache the identifications now: this validates the
      // tables (all data_js files are then served dynamically from this
      // cache). Without them the dataset only offers the raw-spectra pages.
      const source = contents.hasIdentifications ? getDatasetSource(id) : null;
      if (contents.hasIdentifications && !source) throw new Error('the identification tables could not be read');
      const all = source ? source.all : [];
      const counts = countMeta(sqlitePath);
      const meta: DatasetMeta = {
        id,
        name: requested.replace(/\.(sqlite|db)$/i, ''),
        createdAt: new Date().toISOString(),
        hasIdentifications: contents.hasIdentifications,
        prsmCount: all.length,
        proteoformCount: new Set(all.map((d) => d.prsm.proteoClusterId)).size,
        proteinCount: new Set(all.map((d) => d.prsm.protId)).size,
        ms1Count: counts.ms1Count,
        ms2Count: counts.ms2Count,
        hasFasta: contents.hasFasta,
        has3d: contents.has3d,
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
    res.status(500).json({ error: 'upload failed: ' + message });
  }
});

export default router;
