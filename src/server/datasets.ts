// Dataset registry. Each dataset lives in data/<id>/ and holds the uploaded
// input files plus the generated data_js trees:
//   ms.sqlite, prsm.xml, proteoform.xml, [db.fasta], meta.json,
//   toppic_prsm_cutoff/data_js/..., toppic_proteoform_cutoff/data_js/...

import * as fs from 'fs';
import * as path from 'path';
import { DatabaseSync } from 'node:sqlite';

export const DATA_ROOT = path.resolve(process.env.DATA_DIR || path.join(__dirname, '..', '..', 'data'));
fs.mkdirSync(DATA_ROOT, { recursive: true });

export interface DatasetMeta {
  id: string;
  name: string;
  createdAt: string;
  prsmCount: number;
  proteoformCount: number;
  proteinCount: number;
  ms1Count: number;
  ms2Count: number;
  hasFasta: boolean;
}

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

export function listDatasets(): DatasetMeta[] {
  const out: DatasetMeta[] = [];
  for (const entry of fs.readdirSync(DATA_ROOT, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const metaPath = path.join(DATA_ROOT, entry.name, 'meta.json');
    if (!fs.existsSync(metaPath)) continue;
    try {
      out.push(JSON.parse(fs.readFileSync(metaPath, 'utf8')));
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
    return JSON.parse(fs.readFileSync(metaPath, 'utf8'));
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

const openDbs = new Map<string, DatabaseSync>();
const MAX_OPEN = 4;

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
  const sqlitePath = path.join(dir, 'ms.sqlite');
  if (!fs.existsSync(sqlitePath)) return null;
  const db = new DatabaseSync(sqlitePath, { readOnly: true });
  openDbs.set(id, db);
  if (openDbs.size > MAX_OPEN) {
    const oldest = openDbs.keys().next().value as string;
    const old = openDbs.get(oldest);
    openDbs.delete(oldest);
    try { old?.close(); } catch { /* ignore */ }
  }
  return db;
}

export function closeDb(id: string): void {
  const db = openDbs.get(id);
  if (db) {
    openDbs.delete(id);
    try { db.close(); } catch { /* ignore */ }
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
