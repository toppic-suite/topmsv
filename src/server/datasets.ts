// Dataset registry. Each dataset lives in data/<id>/ and holds the uploaded
// uploaded input files:
//   ms.sqlite, [prsm.xml, proteoform.xml], [db.fasta], meta.json
// The TopPIC XMLs come as a pair or not at all; without them the dataset
// has no identification data (only the raw-spectra pages work).

import * as fs from 'fs';
import * as path from 'path';
import { DatabaseSync } from 'node:sqlite';

export const DATA_ROOT = path.resolve(process.env.DATA_DIR || path.join(__dirname, '..', '..', 'data'));
fs.mkdirSync(DATA_ROOT, { recursive: true });

export interface DatasetMeta {
  id: string;
  name: string;
  createdAt: string;
  hasIdentifications: boolean;   // prsm.xml + proteoform.xml were uploaded
  prsmCount: number;
  proteoformCount: number;
  proteinCount: number;
  ms1Count: number;
  ms2Count: number;
  hasFasta: boolean;
  has3d: boolean;                // the sqlite also holds the MS1 3D peak tables (CONFIG + PEAKS<n>)
}

/** The dataset's sqlite file (TopFD output, optionally with the MS1 3D peak tables). */
export const MS_DB_FILE = 'ms.sqlite';
/** Datasets uploaded before TopFD wrote the 3D tables into its own file carry them here. */
const LEGACY_3D_DB_FILE = 'ms1_3d.db';

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

/**
 * Whether a TopFD sqlite also holds the MS1 3D peak tables (the
 * multi-resolution CONFIG + PEAKS<n> layout newer TopFD versions write
 * into the same file). Throws when CONFIG lists more levels than there
 * are PEAKS tables, i.e. the file is truncated.
 */
export function has3dTables(sqlitePath: string): boolean {
  const db = new DatabaseSync(sqlitePath, { readOnly: true });
  try {
    return dbHas3dTables(db);
  } finally {
    db.close();
  }
}

function dbHas3dTables(db: DatabaseSync): boolean {
  const tables = new Set(
    (db.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all() as { name: string }[])
      .map((r) => r.name.toUpperCase()),
  );
  if (!tables.has('CONFIG') || !tables.has('PEAKS0')) return false;
  const levels = (db.prepare('SELECT COUNT(*) AS n FROM CONFIG').get() as { n: number }).n;
  for (let i = 0; i < levels; i++) {
    if (!tables.has('PEAKS' + i)) {
      throw new Error(`the sqlite file lists ${levels} MS1 3D levels in CONFIG but has no PEAKS${i} table`);
    }
  }
  return levels > 0;
}

/** Add spec_id indexes so per-spectrum queries are fast (TopFD ships none). */
export function ensureIndexes(sqlitePath: string): void {
  const db = new DatabaseSync(sqlitePath);
  try {
    // TopFD writes the file in WAL mode; a stale -shm left by an interrupted
    // process makes later read-only opens fail (SQLITE_CANTOPEN). Rollback
    // journaling needs no shared memory, so switch our uploaded copy over.
    db.exec('PRAGMA journal_mode = DELETE;');
    db.exec(`
      CREATE INDEX IF NOT EXISTS ix_ms1_peak_spec ON ms1_peak(spec_id);
      CREATE INDEX IF NOT EXISTS ix_ms1_env_spec ON ms1_env(spec_id);
      CREATE INDEX IF NOT EXISTS ix_ms1_env_peak_spec ON ms1_env_peak(spec_id);
      CREATE INDEX IF NOT EXISTS ix_ms2_peak_spec ON ms2_peak(spec_id);
      CREATE INDEX IF NOT EXISTS ix_ms2_env_spec ON ms2_env(spec_id);
      CREATE INDEX IF NOT EXISTS ix_ms2_env_peak_spec ON ms2_env_peak(spec_id);
    `);
  } finally {
    db.close();
  }
}

// ------------------------------------------------- open sqlite handle cache

// keyed by "<dataset id>/<file name>": the main sqlite, and for legacy
// datasets the separate 3D peak file, may be open at the same time
const openDbs = new Map<string, DatabaseSync>();
const MAX_OPEN = 6;

function getDbFile(id: string, file: string): DatabaseSync | null {
  const key = id + '/' + file;
  const cached = openDbs.get(key);
  if (cached) {
    // refresh LRU position
    openDbs.delete(key);
    openDbs.set(key, cached);
    return cached;
  }
  const dir = datasetDir(id);
  if (!dir) return null;
  const sqlitePath = path.join(dir, file);
  if (!fs.existsSync(sqlitePath)) return null;
  const db = new DatabaseSync(sqlitePath, { readOnly: true });
  openDbs.set(key, db);
  if (openDbs.size > MAX_OPEN) {
    const oldest = openDbs.keys().next().value as string;
    const old = openDbs.get(oldest);
    openDbs.delete(oldest);
    try { old?.close(); } catch { /* ignore */ }
  }
  return db;
}

/** The dataset's sqlite (read-only, cached). */
export function getDb(id: string): DatabaseSync | null {
  return getDbFile(id, MS_DB_FILE);
}

// whether a dataset's main sqlite holds the 3D tables (checked once per handle)
const mainHas3d = new Map<string, boolean>();

/**
 * The database holding the MS1 3D peak tables: the dataset's sqlite when
 * it has them, else the separate file of a legacy upload, else null.
 */
export function getDb3d(id: string): DatabaseSync | null {
  const db = getDb(id);
  if (!db) return null;
  let inMain = mainHas3d.get(id);
  if (inMain === undefined) {
    inMain = dbHas3dTables(db);
    mainHas3d.set(id, inMain);
  }
  if (inMain) return db;
  return getDbFile(id, LEGACY_3D_DB_FILE);
}

export function closeDb(id: string): void {
  mainHas3d.delete(id);
  for (const file of [MS_DB_FILE, LEGACY_3D_DB_FILE]) {
    const key = id + '/' + file;
    const db = openDbs.get(key);
    if (db) {
      openDbs.delete(key);
      try { db.close(); } catch { /* ignore */ }
    }
  }
}

export function countMeta(sqlitePath: string): { ms1Count: number; ms2Count: number } {
  const db = new DatabaseSync(sqlitePath, { readOnly: true });
  try {
    const ms1 = db.prepare('SELECT COUNT(*) AS n FROM ms1_spectrum').get() as unknown as { n: number };
    const ms2 = db.prepare('SELECT COUNT(*) AS n FROM ms2_spectrum').get() as unknown as { n: number };
    return { ms1Count: ms1.n, ms2Count: ms2.n };
  } finally {
    db.close();
  }
}
