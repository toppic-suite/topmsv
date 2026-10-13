// Global API: dataset listing, upload (with conversion), deletion.

import * as express from 'express';
import * as fs from 'fs';
import * as path from 'path';
import multer from 'multer';
import {
  DATA_ROOT, datasetDir, listDatasets, readMeta, deleteDataset, sanitizeId,
  ensureIndexes, inspectSqlite, countMeta, checkDataset, openDatasetDb,
  DatasetMeta, DatasetType, MS_DB_FILE, TOPPIC_DB_FILE, TOPMG_DB_FILE,
} from '../datasets';
import { getDatasetSource, invalidatePrsmSource } from '../prsmSource';
import { APP_DISPLAY_VERSION } from '../version';
import { serverConfig } from '../config';
import { isZstdFile } from '../zstd/extension';

const router = express.Router();

/** Refuse uploads and deletions when the server was started with
 *  --view-only (for uploads this runs before multer, so no temporary file is
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
  res.json({ version: APP_DISPLAY_VERSION, viewOnly: serverConfig.viewOnly });
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

// One field per tool: sqlite (TopFD's <name>.sqlite), topdia_sqlite (TopDIA's
// <name>.sqlite), toppic_sqlite (TopPIC's <name>_toppic.sqlite), topmg_sqlite
// (TopMG's <name>_topmg.sqlite). The fields given name the kind of the
// dataset (toppic_test experiment 170); the spectra file (TopFD's or
// TopDIA's) is stored as ms.sqlite, a TopPIC or TopMG file as toppic.sqlite or
// topmg.sqlite next to it (read together, src/server/sqliteFiles.ts).
const uploadFields = upload.fields([
  { name: 'sqlite', maxCount: 1 },
  { name: 'topdia_sqlite', maxCount: 1 },
  { name: 'toppic_sqlite', maxCount: 1 },
  { name: 'topmg_sqlite', maxCount: 1 },
]);

const KINDS: { type: DatasetType; fields: string[] }[] = [
  { type: 'topfd', fields: ['sqlite'] },
  { type: 'topfd_toppic', fields: ['sqlite', 'toppic_sqlite'] },
  { type: 'topfd_topmg', fields: ['sqlite', 'topmg_sqlite'] },
  { type: 'topdia', fields: ['topdia_sqlite'] },
];
const KIND_ERROR = 'a dataset is one of: a TopFD file alone (field sqlite); a TopFD file and a TopPIC file '
  + '(sqlite, toppic_sqlite); a TopFD file and a TopMG file (sqlite, topmg_sqlite); a TopDIA file alone '
  + '(topdia_sqlite)';

router.post('/datasets', rejectWhenViewOnly, uploadFields, (req, res) => {
  const files = req.files as { [field: string]: Express.Multer.File[] } | undefined;
  const cleanupTmp = () => {
    for (const list of Object.values(files ?? {})) {
      for (const f of list) fs.rmSync(f.path, { force: true });
    }
  };
  try {
    const given = Object.keys(files ?? {}).filter((f) => (files?.[f]?.length ?? 0) > 0).sort();
    const kind = KINDS.find((k) => k.fields.length === given.length && k.fields.every((f) => given.includes(f)));
    if (!kind) {
      cleanupTmp();
      res.status(400).json({ error: given.length === 0 ? 'a sqlite file is required; ' + KIND_ERROR : KIND_ERROR });
      return;
    }
    // the spectra file first, then the search file
    const uploaded = kind.fields.map((f) => files![f][0]);
    if (uploaded.some((f) => !/\.(sqlite|db)$/i.test(f.originalname))) {
      cleanupTmp();
      res.status(400).json({ error: 'the files must be .sqlite/.db files' });
      return;
    }

    const requested = String(req.body.name || '').trim() || uploaded[0].originalname;
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
    // the spectra file (TopFD's or TopDIA's), then TopPIC's or TopMG's
    const sqlitePaths = [path.join(dir, MS_DB_FILE),
      path.join(dir, kind.type === 'topfd_topmg' ? TOPMG_DB_FILE : TOPPIC_DB_FILE)];
    uploaded.forEach((f, i) => fs.renameSync(f.path, sqlitePaths[i]));

    try {
      // whether each file is compressed with sqlite-zstd (TopFD, TopDIA,
      // toppic and topmg compress their databases by default since
      // toppic_test experiment 172; npm run compress since 171)
      const compressed = uploaded.map((_, i) => isZstdFile(sqlitePaths[i]));
      uploaded.forEach((f, i) => console.log(`upload ${id}: ${f.originalname} `
        + (compressed[i] ? 'compressed with sqlite-zstd' : 'not compressed')));
      uploaded.forEach((f, i) => ensureIndexes(sqlitePaths[i]));
      // The identifications and the search database are in TopPIC's or
      // TopMG's file (in older versions, appended to TopFD's), the spectra and
      // the MS1 3D peak tables of newer TopFD versions in TopFD's or TopDIA's
      const db = openDatasetDb(dir);
      if (!db) throw new Error('the sqlite files could not be opened');
      let contents: ReturnType<typeof inspectSqlite>;
      let counts: ReturnType<typeof countMeta>;
      try {
        checkDataset(db, kind.type);
        contents = inspectSqlite(db);
        counts = countMeta(db);
      } finally {
        db.close();
      }
      // Read, match and cache the identifications now: this validates the
      // tables (all data_js files are then served dynamically from this
      // cache). Without them the dataset only offers the raw-spectra pages.
      const source = contents.hasIdentifications ? getDatasetSource(id) : null;
      if (contents.hasIdentifications && !source) throw new Error('the identification tables could not be read');
      const all = source ? source.all : [];
      const meta: DatasetMeta = {
        id,
        type: kind.type,
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
        files: uploaded.map((f) => f.originalname),
        compressed,
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
