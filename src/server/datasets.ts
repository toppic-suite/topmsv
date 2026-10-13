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
import { isZstdFile } from './zstd/extension';
import { isBlobInSchema, spectraOf } from './spectraStore';
import { openSqlitePair, schemaTableNames, tableNames, TOPFD_SCHEMA } from './sqliteFiles';

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
  has3d: boolean;                // the sqlite also holds the MS1 3D view's levels (CONFIG + PEAKS<n>, or ms1_peak.LEVEL)
  files?: string[];              // the names of the uploaded files, the spectra file first (absent before two-file datasets)
  // per uploaded file, in the order of files: compressed with sqlite-zstd
  // (toppic_test experiments 171 and 172); computed from the files for
  // datasets uploaded before the field existed
  compressed?: boolean[];
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

/**
 * Whether each sqlite file of a dataset directory is compressed with
 * sqlite-zstd (it has the extension's table _zstd_configs; opened without
 * the extension), in the order of meta.files: the spectra file, then the
 * TopPIC or TopMG file.
 */
export function fileCompression(dir: string): boolean[] {
  const files = datasetFiles(dir);
  return [files.spectra, files.search].filter((f): f is string => f !== null).map((f) => isZstdFile(f));
}

/** meta.json written before a flag existed lacks it (a dataset without a type has one or two TopFD / TopPIC files). */
function normalizeMeta(meta: DatasetMeta, dir: string): DatasetMeta {
  return {
    ...meta,
    compressed: meta.compressed ?? fileCompression(dir),
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
      out.push(normalizeMeta(JSON.parse(fs.readFileSync(metaPath, 'utf8')), path.join(DATA_ROOT, entry.name)));
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
    return normalizeMeta(JSON.parse(fs.readFileSync(metaPath, 'utf8')), dir);
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
 * Whether the spectra look like TopDIA's: MS1 spectra and MS/MS spectra,
 * none of them linked to an MS1 spectrum (TopDIA deconvolutes the DIA MS/MS
 * windows without their MS1 scan, so ms2_spectrum.ms1_id is -1; TopFD links
 * the MS/MS spectra of DDA data to their MS1 scan). null when the file has
 * no ms1_id column (TopFD and TopDIA before it), which cannot tell.
 */
function looksLikeTopdia(db: DatabaseSync): boolean | null {
  const cols = db.prepare('PRAGMA table_info(ms2_spectrum)').all() as { name: string }[];
  if (!cols.some((c) => c.name === 'ms1_id')) return null;
  const ms1Num = count(db, 'SELECT COUNT(*) AS n FROM ms1_spectrum');
  const ms2Num = count(db, 'SELECT COUNT(*) AS n FROM ms2_spectrum');
  const linked = count(db, 'SELECT COUNT(*) AS n FROM ms2_spectrum WHERE ms1_id >= 0');
  return ms1Num > 0 && ms2Num > 0 && linked === 0;
}

/**
 * Check an uploaded dataset of a kind (throws an Error naming the problem):
 * its files resolve every table the pages read; a TopDIA file looks like
 * TopDIA's and a TopFD file does not (looksLikeTopdia); and of two files,
 * the TopPIC or TopMG file belongs to the TopFD file. A search file with
 * every table (an older TopPIC's copy, or toppic --mass-calib's corrected
 * copy) has the TopFD file's MS/MS spectra (the same ids and scans); one
 * with the envelope tables only has every MS/MS envelope of the TopFD file
 * (spec_id, env_id, mono_mass) and no envelope of a spectrum the TopFD file
 * lacks. Either file may be compressed (toppic_test experiment 171).
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
  const dia = looksLikeTopdia(db);
  if (type === 'topdia' && dia === false) {
    throw new Error('the file is not a TopDIA file: its MS/MS spectra are linked to MS1 spectra '
      + '(ms2_spectrum.ms1_id), as in a TopFD file; upload it as a TopFD file');
  }
  if (type !== 'topdia' && dia === true) {
    throw new Error('the file looks like a TopDIA file: none of its MS/MS spectra is linked to an MS1 '
      + 'spectrum (ms2_spectrum.ms1_id); upload it as a TopDIA file');
  }
  if (!twoFiles) return;
  const mismatch = `the ${tool} file does not belong to the TopFD file: `;
  if (schemaTableNames(db, 'main').has('ms2_spectrum')) {
    const toppicNum = count(db, 'SELECT COUNT(*) AS n FROM main.ms2_spectrum');
    const topfdNum = count(db, `SELECT COUNT(*) AS n FROM ${TOPFD_SCHEMA}.ms2_spectrum`);
    const sameNum = count(db, `SELECT COUNT(*) AS n FROM main.ms2_spectrum m JOIN ${TOPFD_SCHEMA}.ms2_spectrum t `
      + 'ON t.id = m.id AND t.scan = m.scan');
    if (toppicNum !== topfdNum || sameNum !== topfdNum) {
      throw new Error(mismatch + `${toppicNum} and ${topfdNum} MS/MS spectra, ${sameNum} with the same id and scan`);
    }
    return;
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
 * Whether a TopFD sqlite also holds the MS1 3D view's levels: CONFIG with
 * PEAKS0 ... PEAKS<n> (TopFD up to 2.1.0) or with the LEVEL column of a
 * merged ms1_peak (src/server/ms1Peaks.ts). Throws when CONFIG lists more
 * levels than the file holds, i.e. the file is truncated.
 */
export function has3dTables(sqlitePath: string): boolean {
  const db = new DatabaseSync(sqlitePath, { readOnly: true });
  try {
    return dbHas3d(db);
  } finally {
    db.close();
  }
}

/**
 * Add spec_id indexes so per-spectrum queries are fast (TopFD ships none),
 * to the tables the file has (a TopPIC file of a two-file dataset has the
 * MS/MS envelope tables only). A merged ms1_peak (primary key LEVEL,
 * spec_id, peak_id) needs none: its spectrum query names every level
 * (ms1Peaks.ms1PeakSql); nor do BLOB rows (a compressed file, keyed by
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
    if (tables.has('ms1_peak')) {
      const ms1Cols = db.prepare('PRAGMA table_info(ms1_peak)').all() as { name: string }[];
      if (!ms1Cols.some((c) => c.name.toUpperCase() === 'LEVEL')) {
        db.exec('CREATE INDEX IF NOT EXISTS ix_ms1_peak_spec ON ms1_peak(spec_id);');
      }
    }
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
