// Per-dataset routes, mounted at /d/:ds/...
//   /d/:ds/api/...                     sqlite query API for the raw-spectra browser
//   /d/:ds/topfd/ms{1,2}_json/spectrum<id>.js   dynamic TopFD spectrum files
//   /d/:ds/toppic_*_cutoff/data_js/...          generated identification data
//   /d/:ds/<anything else>             shared static assets (topmsv viewer, spectra page)

import * as express from 'express';
import * as path from 'path';
import { datasetDir, getDb, readMeta } from '../datasets';
import { buildSpectrumJs } from '../spectrumJs';
import { buildPrsmJs } from '../prsmSource';

const PUBLIC_DIR = path.join(__dirname, '..', '..', '..', 'public');

const router = express.Router({ mergeParams: true });

function dbOf(req: express.Request) {
  return getDb((req.params as { ds: string }).ds);
}

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

// per-prsm files are generated on the fly (see src/server/prsmSource.ts)
router.get('/:cutoff(toppic_prsm_cutoff|toppic_proteoform_cutoff)/data_js/prsms/prsm:id(\\d+).js', (req, res) => {
  const params = req.params as unknown as { ds: string; cutoff: string; id: string };
  const text = buildPrsmJs(params.ds, params.cutoff, Number(params.id));
  if (text === null) { res.status(404).send('prsm not found'); return; }
  res.type('application/javascript').send(text);
});

router.use('/:cutoff(toppic_prsm_cutoff|toppic_proteoform_cutoff)/data_js', (req, res, next) => {
  const dir = datasetDir((req.params as unknown as { ds: string }).ds);
  if (!dir) { res.status(404).send('dataset not found'); return; }
  express.static(path.join(dir, (req.params as unknown as { cutoff: string }).cutoff, 'data_js'))(req, res, next);
});

// -------------------------------------------------- shared viewer static files

router.use((req, res, next) => {
  express.static(PUBLIC_DIR)(req, res, next);
});

export default router;
