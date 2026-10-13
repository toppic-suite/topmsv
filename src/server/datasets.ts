// Dataset registry. Each dataset lives in data/<id>/ and holds the uploaded
// sqlite files and meta.json:
//   ms.sqlite       TopFD's file, or the one file of a single-file dataset
//   toppic.sqlite   TopPIC's file of a two-file dataset (src/server/sqliteFiles.ts)
// Without TopPIC's identification tables the dataset has no identification
// data (only the raw-spectra pages work).

import * as fs from 'fs';
import * as path from 'path';
import { DatabaseSync } from 'node:sqlite';
import { dbHasIdentifications, dbHasFasta } from './convert/toppicSqlite';
import { dbHas3d } from './ms1Peaks';
import { openSqlitePair, schemaTableNames, tableNames, TOPFD_SCHEMA } from './sqliteFiles';

export const DATA_ROOT = path.resolve(process.env.DATA_DIR || path.join(__dirname, '..', '..', 'data'));
fs.mkdirSync(DATA_ROOT, { recursive: true });

export interface DatasetMeta {
  id: string;
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
  files?: string[];              // the names of the uploaded files, TopFD's first (absent before two-file datasets)
}

/** The dataset's TopFD file, or its only file (TopFD output, optionally with TopPIC's tables). */
export const MS_DB_FILE = 'ms.sqlite';
/** TopPIC's file of a two-file dataset. */
export const TOPPIC_DB_FILE = 'toppic.sqlite';

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

/** meta.json written before a flag existed lacks it. */
function normalizeMeta(meta: DatasetMeta): DatasetMeta {
  return { ...meta, hasIdentifications: meta.hasIdentifications ?? true, has3d: meta.has3d ?? false };
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

/** The dataset's sqlite files in a dataset directory (toppic null for a single file). */
export function datasetFiles(dir: string): { topfd: string | null; toppic: string | null } {
  const existing = (name: string) => {
    const p = path.join(dir, name);
    return fs.existsSync(p) ? p : null;
  };
  return { topfd: existing(MS_DB_FILE), toppic: existing(TOPPIC_DB_FILE) };
}

/** A read-only connection to the files of a dataset directory, or null without a file. */
export function openDatasetDb(dir: string): DatabaseSync | null {
  const files = datasetFiles(dir);
  if (files.topfd === null && files.toppic === null) return null;
  return openSqlitePair(files.topfd, files.toppic);
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
 * Check an uploaded dataset (throws an Error naming the problem): its files
 * resolve every table the pages read, and of two files, the TopPIC file
 * belongs to the TopFD file. A TopPIC file with every table (an older
 * TopPIC's copy, or toppic --mass-calib's corrected copy) has the TopFD
 * file's MS/MS spectra (the same ids and scans); one with the envelope tables
 * only has every MS/MS envelope of the TopFD file (spec_id, env_id,
 * mono_mass) and no envelope of a spectrum the TopFD file lacks.
 */
export function checkDataset(db: DatabaseSync, twoFiles: boolean): void {
  const tables = tableNames(db);
  const missing = REQUIRED_TABLES.filter((t) => !tables.has(t));
  if (missing.length > 0) {
    if (!twoFiles && !tables.has('ms2_spectrum') && tables.has('ms2_env')) {
      throw new Error('the sqlite file has no spectra: it is a TopPIC file (<name>_toppic.sqlite) '
        + 'that holds the MS/MS envelopes and the identifications only; upload it together '
        + 'with the TopFD file (<name>.sqlite) it was searched with');
    }
    throw new Error(`the sqlite file${twoFiles ? 's lack' : ' lacks'} the table${missing.length > 1 ? 's' : ''} `
      + missing.join(', '));
  }
  if (!twoFiles) return;
  if (!schemaTableNames(db, TOPFD_SCHEMA).has('ms2_spectrum')) {
    throw new Error('the TopFD file has no spectra (no ms2_spectrum table): were the TopFD and the '
      + 'TopPIC file swapped?');
  }
  const mismatch = 'the TopPIC file does not belong to the TopFD file: ';
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
    throw new Error(mismatch + `${lost} MS/MS envelopes of the TopFD file are not in the TopPIC file`);
  }
  const foreign = count(db, `SELECT COUNT(*) AS n FROM main.ms2_env WHERE spec_id NOT IN `
    + `(SELECT id FROM ${TOPFD_SCHEMA}.ms2_spectrum)`);
  if (foreign > 0) {
    throw new Error(mismatch + `${foreign} MS/MS envelopes of the TopPIC file belong to no spectrum of the TopFD file`);
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
 * (ms1Peaks.ms1PeakSql).
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
