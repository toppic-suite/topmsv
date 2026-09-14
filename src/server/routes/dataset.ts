// Per-dataset routes, mounted at /d/:ds/...
//   /d/:ds/api/...                     sqlite query API for the raw-spectra browser
//   /d/:ds/api/3d/...                  MS1 3D view API over the sqlite's 3D peak tables (see below)
//   /d/:ds/topfd/ms{1,2}_json/spectrum<id>.js   dynamic TopFD spectrum files
//   /d/:ds/toppic_*_cutoff/data_js/...          generated identification data
//   /d/:ds/vendor/...                  browser libraries served from node_modules
//   /d/:ds/<anything else>             shared static assets (topmsv viewer, spectra page)

import * as express from 'express';
import * as path from 'path';
import { getDb, getDb3d, readMeta } from '../datasets';
import { buildSpectrumJs } from '../spectrumJs';
import { buildDataJsFile } from '../prsmSource';
import vendorRouter from '../vendor';

const PUBLIC_DIR = path.join(__dirname, '..', '..', '..', 'public');

const router = express.Router({ mergeParams: true });

function dbOf(req: express.Request) {
  return getDb((req.params as { ds: string }).ds);
}

// ------------------------------------------------------------------ MS1 3D view
// Newer TopFD versions write the MS1 peaks at several resolutions into the
// same sqlite: CONFIG has one row per level with the data bounds and the
// peak count of PEAKS<level>; RETENTIONTIME is in milliseconds. The API
// converts retention times to minutes. getDb3d is null (404 here) for a
// file without those tables.

const RT_MS_PER_MIN = 60000;
const MAX_3D_PEAKS = 20000;

function num(v: unknown, fallback: number): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

// total intensity of the full-resolution level per dataset (one scan of
// PEAKS0, cached; the page scales weak regions relative to it)
const totalIntensityCache = new Map<string, number>();

// Levels (index, m/z and RT (minutes) bounds, intensity bounds, peak count)
// and the total intensity of the run.
router.get('/api/3d/config', (req, res) => {
  const ds = (req.params as { ds: string }).ds;
  const db = getDb3d(ds);
  if (!db) { res.status(404).json({ error: 'this dataset has no MS1 3D peak tables' }); return; }
  const rows = db.prepare('SELECT * FROM CONFIG').all() as any[];
  let totalIntensity = totalIntensityCache.get(ds);
  if (totalIntensity === undefined) {
    totalIntensity = (db.prepare('SELECT SUM(INTENSITY) AS s FROM PEAKS0').get() as { s: number }).s ?? 0;
    totalIntensityCache.set(ds, totalIntensity);
  }
  res.json({
    levels: rows.map((r, i) => ({
      level: i,
      mzMin: r.MZMIN, mzMax: r.MZMAX,
      rtMin: r.RTMIN / RT_MS_PER_MIN, rtMax: r.RTMAX / RT_MS_PER_MIN,
      intMin: r.INTMIN, intMax: r.INTMAX,
      count: r.COUNT,
    })),
    totalIntensity,
  });
});

// The strongest peaks of one level inside an m/z x RT (minutes) window.
router.get('/api/3d/peaks', (req, res) => {
  const db = getDb3d((req.params as { ds: string }).ds);
  if (!db) { res.status(404).json({ error: 'this dataset has no MS1 3D peak tables' }); return; }
  const levels = (db.prepare('SELECT COUNT(*) AS n FROM CONFIG').get() as { n: number }).n;
  const level = Math.floor(num(req.query.level, levels - 1));
  if (level < 0 || level >= levels) { res.status(400).json({ error: 'level out of range' }); return; }
  const maxPeaks = Math.min(MAX_3D_PEAKS, Math.max(1, Math.floor(num(req.query.maxPeaks, 4000))));
  const rows = db.prepare(
    `SELECT MZ, INTENSITY, RETENTIONTIME, COLOR FROM PEAKS${level}
     WHERE RETENTIONTIME >= ? AND RETENTIONTIME <= ? AND MZ >= ? AND MZ <= ? AND INTENSITY > ?
     ORDER BY INTENSITY DESC LIMIT ?`,
  ).all(
    num(req.query.minRt, 0) * RT_MS_PER_MIN, num(req.query.maxRt, Number.MAX_SAFE_INTEGER / RT_MS_PER_MIN) * RT_MS_PER_MIN,
    num(req.query.minMz, 0), num(req.query.maxMz, Number.MAX_VALUE),
    num(req.query.cutoff, 0), maxPeaks,
  ) as any[];
  res.json(rows.map((r) => ({ mz: r.MZ, intensity: r.INTENSITY, rt: r.RETENTIONTIME / RT_MS_PER_MIN, color: r.COLOR })));
});

// MS1 scans of the TopFD file with their retention times (minutes), for
// naming the scan under the cursor and highlighting one scan.
router.get('/api/3d/scans', (req, res) => {
  const db = dbOf(req);
  if (!db) { res.json([]); return; }
  const rows = db.prepare('SELECT id, scan, retention_time FROM ms1_spectrum ORDER BY retention_time').all() as any[];
  res.json(rows.map((r) => ({ id: r.id, scan: r.scan, rt: r.retention_time / 60 })));
});

// ------------------------------------------------------------------ meta

router.get('/api/meta', (req, res) => {
  const meta = readMeta((req.params as { ds: string }).ds);
  if (!meta) { res.status(404).json({ error: 'dataset not found' }); return; }
  res.json(meta);
});

// ------------------------------------------- sqlite query API (spectra page)

router.get('/api/scan-num', (req, res) => {
  const db = dbOf(req);
  if (!db) { res.json(0); return; }
  const row = db.prepare('SELECT COUNT(*) AS n FROM ms1_spectrum').get() as any;
  res.json(row ? row.n : 0);
});

router.get('/api/ms2-scan-num', (req, res) => {
  const db = dbOf(req);
  if (!db) { res.json(0); return; }
  const row = db.prepare('SELECT COUNT(*) AS n FROM ms2_spectrum').get() as any;
  res.json(row ? row.n : 0);
});

router.get('/api/info/:id', (req, res) => {
  const db = dbOf(req);
  if (!db) { res.json(null); return; }
  res.json(db.prepare('SELECT * FROM ms1_spectrum WHERE id = ?').get(Number(req.params.id)) ?? null);
});

router.get('/api/ms2-info/:id', (req, res) => {
  const db = dbOf(req);
  if (!db) { res.json(null); return; }
  res.json(db.prepare('SELECT * FROM ms2_spectrum WHERE id = ?').get(Number(req.params.id)) ?? null);
});

router.get('/api/peaks/:id', (req, res) => {
  const db = dbOf(req);
  if (!db) { res.json([]); return; }
  res.json(db.prepare('SELECT mz, intensity FROM ms1_peak WHERE spec_id = ?').all(Number(req.params.id)));
});

router.get('/api/ms2-peaks/:id', (req, res) => {
  const db = dbOf(req);
  if (!db) { res.json([]); return; }
  res.json(db.prepare('SELECT mz, intensity FROM ms2_peak WHERE spec_id = ?').all(Number(req.params.id)));
});

router.get('/api/envs/:id', (req, res) => {
  const db = dbOf(req);
  if (!db) { res.json([]); return; }
  res.json(db.prepare('SELECT * FROM ms1_env WHERE spec_id = ?').all(Number(req.params.id)));
});

router.get('/api/ms2-envs/:id', (req, res) => {
  const db = dbOf(req);
  if (!db) { res.json([]); return; }
  res.json(db.prepare('SELECT * FROM ms2_env WHERE spec_id = ?').all(Number(req.params.id)));
});

router.get('/api/env-peaks/:id', (req, res) => {
  const db = dbOf(req);
  if (!db) { res.json([]); return; }
  res.json(db.prepare('SELECT * FROM ms1_env_peak WHERE spec_id = ?').all(Number(req.params.id)));
});

router.get('/api/ms2-env-peaks/:id', (req, res) => {
  const db = dbOf(req);
  if (!db) { res.json([]); return; }
  res.json(db.prepare('SELECT * FROM ms2_env_peak WHERE spec_id = ?').all(Number(req.params.id)));
});

router.get('/api/id-by-scan/:scan', (req, res) => {
  const db = dbOf(req);
  if (!db) { res.json(null); return; }
  res.json(db.prepare('SELECT id FROM ms1_spectrum WHERE scan >= ? ORDER BY scan LIMIT 1')
    .get(Number(req.params.scan)) ?? null);
});

router.get('/api/ms2-id-by-scan/:scan', (req, res) => {
  const db = dbOf(req);
  if (!db) { res.json(null); return; }
  res.json(db.prepare('SELECT id FROM ms2_spectrum WHERE scan >= ? ORDER BY scan LIMIT 1')
    .get(Number(req.params.scan)) ?? null);
});

router.get('/api/ms2-id-by-ms1/:id', (req, res) => {
  const db = dbOf(req);
  if (!db) { res.json(null); return; }
  try {
    const row = db.prepare('SELECT MIN(id) AS id FROM ms2_spectrum WHERE ms1_id = ?')
      .get(Number(req.params.id)) as any;
    if (row && row.id !== null) res.json({ id: row.id });
    else res.json({ id: -1 });
  } catch {
    res.json(null); // file predates ms1_id linking
  }
});

// ---------------------------------------------- dynamic TopFD spectrum files

router.get('/topfd/:msdir(ms1_json|ms2_json)/spectrum:id(\\d+).js', (req, res) => {
  const db = dbOf(req);
  if (!db) { res.status(404).send('dataset not found'); return; }
  const level = req.params.msdir === 'ms1_json' ? 1 : 2;
  const text = buildSpectrumJs(db, level as 1 | 2, Number(req.params.id));
  if (text === null) { res.status(404).send('spectrum not found'); return; }
  res.type('application/javascript').send(text);
});

// ----------------------------------- generated identification data (data_js)

// All data_js files are generated on the fly (see src/server/prsmSource.ts).
router.get('/:cutoff(toppic_prsm_cutoff|toppic_proteoform_cutoff)/data_js/*', (req, res) => {
  const params = req.params as unknown as { ds: string; cutoff: string; 0: string };
  try {
    const text = buildDataJsFile(params.ds, params.cutoff, params[0]);
    if (text === null) { res.status(404).send('not found'); return; }
    res.type('application/javascript').send(text);
  } catch (err) {
    res.status(500).send('failed to generate data file: '
      + (err instanceof Error ? err.message : String(err)));
  }
});

// -------------------------------------------------- shared viewer static files

router.use('/vendor', vendorRouter);

router.use((req, res, next) => {
  express.static(PUBLIC_DIR)(req, res, next);
});

export default router;
