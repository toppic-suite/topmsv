// Dataset registry. Each dataset lives in data/<id>/ and holds the uploaded
// sqlite files and meta.json:
//   ms.sqlite       TopFD's or TopDIA's file (the spectra)
//   toppic.sqlite   TopPIC's file of a TopFD + TopPIC dataset, or
//   topmg.sqlite    TopMG's file of a TopFD + TopMG dataset
//                   (read with TopFD's, src/server/sqliteFiles.ts)
// A dataset is one of four kinds (DatasetType, toppic_test experiment 170).
// Without identification tables the dataset has no identification data
// (only the raw-spectra pages work).

import * as fs from 'fs';
import * as path from 'path';
import { DatabaseSync } from 'node:sqlite';
import { dbHasIdentifications, dbHasFasta } from './convert/toppicSqlite';
import { dbHas3d } from './ms1Peaks';
import { isBlobInSchema, schemaSpectrumColumns, spectraOf } from './spectraStore';
import { fileTableNames, openSqlitePair, schemaTableNames, tableNames, TOPFD_SCHEMA } from './sqliteFiles';

export const DATA_ROOT = path.resolve(process.env.DATA_DIR || path.join(__dirname, '..', '..', 'data'));
fs.mkdirSync(DATA_ROOT, { recursive: true });

/**
 * The kinds of datasets: a TopFD file alone (also a file of an older TopPIC
 * or TopMG version that wrote its tables into TopFD's file), a TopFD file
 * with a TopPIC or a TopMG file, or a TopDIA file alone.
 */
export type DatasetType = 'topfd' | 'topfd_toppic' | 'topfd_topmg' | 'topdia';

export interface DatasetMeta {
  id: string;
  type: DatasetType;
  name: string;
  createdAt: string;
  hasIdentifications: boolean;   // the sqlite holds the TopPIC identification tables
  prsmCount: number;
  proteoformCount: number;
  proteinCount: number;
  ms1Count: number;
  ms2Count: number;
  hasFasta: boolean;             // the sqlite holds the search database (fasta_seq)
  has3d: boolean;                // the sqlite also holds the MS1 3D view's levels (CONFIG + ms1_peak.LEVEL)
  files?: string[];              // the names of the uploaded files, the spectra file first (absent before two-file datasets)
}

/** The dataset's spectra file: TopFD's (optionally with an older TopPIC's tables) or TopDIA's. */
export const MS_DB_FILE = 'ms.sqlite';
/** TopPIC's file of a TopFD + TopPIC dataset. */
export const TOPPIC_DB_FILE = 'toppic.sqlite';
/** TopMG's file of a TopFD + TopMG dataset. */
export const TOPMG_DB_FILE = 'topmg.sqlite';

export function sanitizeId(name: string): string {
  const id = name.replace(/\.[^.]*$/, '').replace(/[^A-Za-z0-9_-]+/g, '_').replace(/^_+|_+$/g, '');
  return id || 'dataset';
}

export function datasetDir(id: string): string | null {
  if (!/^[A-Za-z0-9_-]+$/.test(id)) return null;
  const abs = path.resolve(DATA_ROOT, id);
  if (!abs.startsWith(DATA_ROOT + path.sep)) return null;
  return abs;
}

/** meta.json written before a flag existed lacks it (a dataset without a type has one or two TopFD / TopPIC files). */
function normalizeMeta(meta: DatasetMeta): DatasetMeta {
  return {
    ...meta,
    type: meta.type ?? ((meta.files?.length ?? 1) > 1 ? 'topfd_toppic' : 'topfd'),
    hasIdentifications: meta.hasIdentifications ?? true,
    has3d: meta.has3d ?? false,
  };
}

export function listDatasets(): DatasetMeta[] {
  const out: DatasetMeta[] = [];
  for (const entry of fs.readdirSync(DATA_ROOT, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const metaPath = path.join(DATA_ROOT, entry.name, 'meta.json');
    if (!fs.existsSync(metaPath)) continue;
    try {
      out.push(normalizeMeta(JSON.parse(fs.readFileSync(metaPath, 'utf8'))));
    } catch {
      /* ignore broken metadata */
    }
  }
  out.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  return out;
}

export function readMeta(id: string): DatasetMeta | null {
  const dir = datasetDir(id);
  if (!dir) return null;
  const metaPath = path.join(dir, 'meta.json');
  if (!fs.existsSync(metaPath)) return null;
  try {
    return normalizeMeta(JSON.parse(fs.readFileSync(metaPath, 'utf8')));
  } catch {
    return null;
  }
}

export function deleteDataset(id: string): boolean {
  const dir = datasetDir(id);
  if (!dir || !fs.existsSync(path.join(dir, 'meta.json'))) return false;
  closeDb(id);
  fs.rmSync(dir, { recursive: true, force: true });
  return true;
}

/**
 * The dataset's sqlite files in a dataset directory: the spectra file
 * (TopFD's or TopDIA's) and the search file (TopPIC's or TopMG's; null for a
 * single file).
 */
export function datasetFiles(dir: string): { spectra: string | null; search: string | null } {
  const existing = (name: string) => {
    const p = path.join(dir, name);
    return fs.existsSync(p) ? p : null;
  };
  return { spectra: existing(MS_DB_FILE), search: existing(TOPPIC_DB_FILE) ?? existing(TOPMG_DB_FILE) };
}

/** A read-only connection to the files of a dataset directory, or null without a file. */
export function openDatasetDb(dir: string): DatabaseSync | null {
  const files = datasetFiles(dir);
  if (files.spectra === null && files.search === null) return null;
  return openSqlitePair(files.spectra, files.search);
}

/** What a dataset's files hold besides the TopFD results. */
export function inspectSqlite(db: DatabaseSync): { hasIdentifications: boolean; hasFasta: boolean; has3d: boolean } {
  return { hasIdentifications: dbHasIdentifications(db), hasFasta: dbHasFasta(db), has3d: dbHas3d(db) };
}

/** Why a spectra file of an older TopFD or TopDIA version is refused. */
const OLD_SPECTRA_FILE = 'the spectra file was written by an older TopFD or TopDIA version (without '
  + 'ms1_peak.LEVEL or ms2_spectrum.ms1_id), which TopMSV does not support: deconvolute the spectra again with the '
  + 'current TopFD or TopDIA';

/** The tables the pages read: every dataset resolves each of them. */
const REQUIRED_TABLES = [
  'ms1_spectrum', 'ms2_spectrum', 'ms1_peak', 'ms2_peak',
  'ms1_env', 'ms1_env_peak', 'ms2_env', 'ms2_env_peak',
];

function count(db: DatabaseSync, sql: string): number {
  return (db.prepare(sql).get() as { n: number }).n;
}

/**
 * The envelope check of two files when either stores ms2_env as BLOB rows
 * (a compressed file, src/server/spectraStore.ts), as the SQL of
 * checkDataset counts them: the TopFD file's MS/MS envelopes (spec_id,
 * env_id, mono_mass) missing from the main file, and the main file's
 * envelopes of a spectrum the TopFD file lacks. Both files are read once in
 * spectrum order.
 */
function envelopeCheckBySpectrum(db: DatabaseSync): { lost: number; foreign: number } {
  const ms2Ids = new Set((db.prepare(`SELECT id FROM ${TOPFD_SCHEMA}.ms2_spectrum`).all() as { id: number }[])
    .map((r) => r.id));
  const cols = ['env_id', 'mono_mass'];
  const main = spectraOf(db, 'main', 'ms2_env', cols);
  let m = main.next();
  let lost = 0;
  let foreign = 0;
  const skip = () => {
    if (!m.done && !ms2Ids.has(m.value.specId)) foreign += m.value.values[0].length;
    m = main.next();
  };
  for (const t of spectraOf(db, TOPFD_SCHEMA, 'ms2_env', cols)) {
    while (!m.done && m.value.specId < t.specId) skip();
    const keys = new Set<string>();
    if (!m.done && m.value.specId === t.specId) {
      const [env, mono] = m.value.values;
      for (let i = 0; i < env.length; i++) keys.add(env[i] + ':' + mono[i]);
    }
    const [env, mono] = t.values;
    for (let i = 0; i < env.length; i++) if (!keys.has(env[i] + ':' + mono[i])) lost++;
  }
  while (!m.done) skip();
  return { lost, foreign };
}

/**
 * Whether the spectra file of a dataset is in the layout of the current
 * TopFD and TopDIA: the MS/MS spectra linked to their MS1 spectrum
 * (ms2_spectrum.ms1_id) and the MS1 peaks with their 3D level
 * (ms1_peak.LEVEL, src/server/ms1Peaks.ts). Files of older versions lack
 * one or both and are not supported. schema: the file ('main' or TOPFD_SCHEMA).
 */
function hasCurrentLayout(db: DatabaseSync, schema: string): boolean {
  const ms2Cols = db.prepare(`PRAGMA ${schema}.table_info(ms2_spectrum)`).all() as { name: string }[];
  return ms2Cols.some((c) => c.name === 'ms1_id')
    && schemaSpectrumColumns(db, schema, 'ms1_peak').some((c) => c.toUpperCase() === 'LEVEL');
}

/**
 * Whether the spectra look like TopDIA's: MS1 spectra and MS/MS spectra,
 * none of them linked to an MS1 spectrum (TopDIA deconvolutes the DIA MS/MS
 * windows without their MS1 scan, so ms2_spectrum.ms1_id is -1; TopFD links
 * the MS/MS spectra of DDA data to their MS1 scan).
 */
function looksLikeTopdia(db: DatabaseSync): boolean {
  const ms1Num = count(db, 'SELECT COUNT(*) AS n FROM ms1_spectrum');
  const ms2Num = count(db, 'SELECT COUNT(*) AS n FROM ms2_spectrum');
  const linked = count(db, 'SELECT COUNT(*) AS n FROM ms2_spectrum WHERE ms1_id >= 0');
  return ms1Num > 0 && ms2Num > 0 && linked === 0;
}

/**
 * Check an uploaded dataset of a type (throws an Error naming the problem;
 * the home page runs the same checks in the browser before the upload,
 * src/client/upload_check.ts): its files resolve every table the pages
 * read; the spectra file is in the current layout (hasCurrentLayout); a
 * TopDIA file looks like TopDIA's and a TopFD file does not
 * (looksLikeTopdia); a TopFD or TopDIA file alone holds no identifications
 * (those of an older TopPIC or TopMG version written into TopFD's file are
 * not supported); and of two files, the TopPIC or TopMG file holds the
 * identifications and belongs to the TopFD file. A search file with every
 * table (toppic --mass-calib's corrected copy) has the TopFD file's MS/MS
 * spectra (the same ids and scans); one with the envelope tables only has
 * every MS/MS envelope of the TopFD file (spec_id, env_id, mono_mass) and no
 * envelope of a spectrum the TopFD file lacks. Either file may be
 * compressed (toppic_test experiment 171).
 */
export function checkDataset(db: DatabaseSync, type: DatasetType): void {
  const twoFiles = type === 'topfd_toppic' || type === 'topfd_topmg';
  const tool = type === 'topfd_topmg' ? 'TopMG' : 'TopPIC';
  const tables = tableNames(db);
  const missing = REQUIRED_TABLES.filter((t) => !tables.has(t));
  if (missing.length > 0) {
    if (!twoFiles && !tables.has('ms2_spectrum') && tables.has('ms2_env')) {
      throw new Error('the sqlite file has no spectra: it is a TopPIC or TopMG file (<name>_toppic.sqlite, '
        + '<name>_topmg.sqlite) that holds the MS/MS envelopes and the identifications only; upload it '
        + 'together with the TopFD file (<name>.sqlite) it was searched with');
    }
    throw new Error(`the sqlite file${twoFiles ? 's lack' : ' lacks'} the table${missing.length > 1 ? 's' : ''} `
      + missing.join(', '));
  }
  if (twoFiles && !schemaTableNames(db, TOPFD_SCHEMA).has('ms2_spectrum')) {
    throw new Error(`the TopFD file has no spectra (no ms2_spectrum table): were the TopFD and the `
      + `${tool} file swapped?`);
  }
  if (!hasCurrentLayout(db, twoFiles ? TOPFD_SCHEMA : 'main')) throw new Error(OLD_SPECTRA_FILE);
  if (!twoFiles && dbHasIdentifications(db)) {
    throw new Error('the sqlite file holds identifications (the tables prsm, proteoform, prsm_mass_shift): it is a '
      + 'TopPIC or TopMG file, to be uploaded with the TopFD file it was searched with');
  }
  const dia = looksLikeTopdia(db);
  if (type === 'topdia' && !dia) {
    throw new Error('the file is not a TopDIA file: its MS/MS spectra are linked to MS1 spectra '
      + '(ms2_spectrum.ms1_id), as in a TopFD file; upload it as a TopFD file');
  }
  if (type !== 'topdia' && dia) {
    throw new Error('the file looks like a TopDIA file: none of its MS/MS spectra is linked to an MS1 '
      + 'spectrum (ms2_spectrum.ms1_id); upload it as a TopDIA file');
  }
  if (!twoFiles) return;
  const mainTables = fileTableNames(db, 'main');
  const noIdentifications = ['prsm', 'proteoform', 'prsm_mass_shift'].filter((t) => !mainTables.has(t));
  if (noIdentifications.length > 0) {
    throw new Error(`the ${tool} file lacks the identification table${noIdentifications.length > 1 ? 's' : ''} `
      + noIdentifications.join(', '));
  }
  const mismatch = `the ${tool} file does not belong to the TopFD file: `;
  if (mainTables.has('ms2_spectrum')) {
    if (!hasCurrentLayout(db, 'main')) {
      throw new Error(`the ${tool} file was written by an older ${tool} version (a copy of every table of an `
        + `older TopFD file), which TopMSV does not support: search the spectra again with the current ${tool}`);
    }
    const toppicNum = count(db, 'SELECT COUNT(*) AS n FROM main.ms2_spectrum');
    const topfdNum = count(db, `SELECT COUNT(*) AS n FROM ${TOPFD_SCHEMA}.ms2_spectrum`);
    const sameNum = count(db, `SELECT COUNT(*) AS n FROM main.ms2_spectrum m JOIN ${TOPFD_SCHEMA}.ms2_spectrum t `
      + 'ON t.id = m.id AND t.scan = m.scan');
    if (toppicNum !== topfdNum || sameNum !== topfdNum) {
      throw new Error(mismatch + `${toppicNum} and ${topfdNum} MS/MS spectra, ${sameNum} with the same id and scan`);
    }
    return;
  }
  if (!mainTables.has('ms2_env')) {
    throw new Error(`the ${tool} file lacks the MS/MS envelopes (the table ms2_env) it copies from the TopFD file`);
  }
  if (isBlobInSchema(db, 'main', 'ms2_env') || isBlobInSchema(db, TOPFD_SCHEMA, 'ms2_env')) {
    const { lost, foreign } = envelopeCheckBySpectrum(db);
    if (lost > 0) throw new Error(mismatch + `${lost} MS/MS envelopes of the TopFD file are not in the ${tool} file`);
    if (foreign > 0) {
      throw new Error(mismatch + `${foreign} MS/MS envelopes of the ${tool} file belong to no spectrum of the TopFD file`);
    }
    return;
  }
  // TopPIC copies TopFD's envelope rows in rowid order, so they keep their
  // rowids: one join on the rowid finds them (0.2 s for 480_F3_02's 701,494
  // envelopes, toppic_test experiment 168); only when it misses some is
  // every envelope looked for by spectrum (13 s)
  const topfdNum = count(db, `SELECT COUNT(*) AS n FROM ${TOPFD_SCHEMA}.ms2_env`);
  const sameRowid = count(db, `SELECT COUNT(*) AS n FROM ${TOPFD_SCHEMA}.ms2_env t JOIN main.ms2_env m `
    + 'ON m.rowid = t.rowid AND m.spec_id = t.spec_id AND m.env_id = t.env_id AND m.mono_mass = t.mono_mass');
  const lost = sameRowid === topfdNum ? 0 : count(db, `SELECT COUNT(*) AS n FROM ${TOPFD_SCHEMA}.ms2_env t `
    + 'WHERE NOT EXISTS (SELECT 1 FROM main.ms2_env m WHERE m.spec_id = t.spec_id AND m.env_id = t.env_id '
    + 'AND m.mono_mass = t.mono_mass)');
  if (lost > 0) {
    throw new Error(mismatch + `${lost} MS/MS envelopes of the TopFD file are not in the ${tool} file`);
  }
  const foreign = count(db, `SELECT COUNT(*) AS n FROM main.ms2_env WHERE spec_id NOT IN `
    + `(SELECT id FROM ${TOPFD_SCHEMA}.ms2_spectrum)`);
  if (foreign > 0) {
    throw new Error(mismatch + `${foreign} MS/MS envelopes of the ${tool} file belong to no spectrum of the TopFD file`);
  }
}

/**
 * Add spec_id indexes so per-spectrum queries are fast (TopFD ships none),
 * to the tables the file has (a TopPIC file of a two-file dataset has the
 * MS/MS envelope tables only). ms1_peak (primary key LEVEL, spec_id,
 * peak_id) needs none: its spectrum query names every level
 * (ms1Peaks.ms1PeakRows); nor do BLOB rows (a compressed file, keyed by
 * spec_id), which schemaTableNames does not list under the tables' names.
 */
export function ensureIndexes(sqlitePath: string): void {
  const db = new DatabaseSync(sqlitePath);
  try {
    // TopFD and TopPIC write the file in WAL mode; a stale -shm left by an
    // interrupted process makes later read-only opens fail (SQLITE_CANTOPEN).
    // Rollback journaling needs no shared memory, so switch our uploaded copy
    // over.
    db.exec('PRAGMA journal_mode = DELETE;');
    const tables = schemaTableNames(db, 'main');
    for (const table of ['ms1_env', 'ms1_env_peak', 'ms2_peak', 'ms2_env', 'ms2_env_peak']) {
      if (tables.has(table)) db.exec(`CREATE INDEX IF NOT EXISTS ix_${table}_spec ON ${table}(spec_id);`);
    }
  } finally {
    db.close();
  }
}

// ------------------------------------------------- open sqlite handle cache

const openDbs = new Map<string, DatabaseSync>();
const MAX_OPEN = 4;

/** The dataset's sqlite files as one read-only connection (cached). */
export function getDb(id: string): DatabaseSync | null {
  const cached = openDbs.get(id);
  if (cached) {
    // refresh LRU position
    openDbs.delete(id);
    openDbs.set(id, cached);
    return cached;
  }
  const dir = datasetDir(id);
  if (!dir) return null;
  const db = openDatasetDb(dir);
  if (!db) return null;
  openDbs.set(id, db);
  if (openDbs.size > MAX_OPEN) {
    const oldest = openDbs.keys().next().value as string;
    const old = openDbs.get(oldest);
    openDbs.delete(oldest);
    try { old?.close(); } catch { /* ignore */ }
  }
  return db;
}

// whether a dataset's sqlite holds the 3D tables (checked once per handle)
const has3dCache = new Map<string, boolean>();

/** The dataset's sqlite when it holds the MS1 3D view's levels, else null. */
export function getDb3d(id: string): DatabaseSync | null {
  const db = getDb(id);
  if (!db) return null;
  let has3d = has3dCache.get(id);
  if (has3d === undefined) {
    has3d = dbHas3d(db);
    has3dCache.set(id, has3d);
  }
  return has3d ? db : null;
}

export function closeDb(id: string): void {
  has3dCache.delete(id);
  const db = openDbs.get(id);
  if (db) {
    openDbs.delete(id);
    try { db.close(); } catch { /* ignore */ }
  }
}

export function countMeta(db: DatabaseSync): { ms1Count: number; ms2Count: number } {
  return {
    ms1Count: count(db, 'SELECT COUNT(*) AS n FROM ms1_spectrum'),
    ms2Count: count(db, 'SELECT COUNT(*) AS n FROM ms2_spectrum'),
  };
}
