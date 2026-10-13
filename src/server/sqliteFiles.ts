// The sqlite files of a dataset, read through one connection.
//
// Newer TopPIC versions (toppic_test experiment 168) write their own
// <base>_toppic.sqlite with only TopFD's MS/MS envelope tables (ms2_env and
// ms2_env_peak, plus the envelopes of TopPIC's post mass matching) and the
// identification tables; the spectra, the peaks, the MS1 envelopes and the
// MS1 3D levels stay in TopFD's <base>.sqlite. (After toppic --mass-calib the
// TopPIC file has every table, with the m/z values and masses corrected.) A
// dataset is then two files: the TopPIC file is opened as the main database
// and the TopFD file attached as schema "topfd", so that an unqualified table
// name resolves to the TopPIC file when it has the table and to the TopFD
// file otherwise (SQLite looks in main before the attached databases): data
// missing from the TopPIC file is found in the TopFD file. A single file
// (TopFD's alone, or an older TopPIC's file with every table) is opened alone.
//
// Any of the files may be compressed by `npm run compress` (toppic_test
// experiment 171): its per-spectrum tables are then <table>_blob views of
// sqlite-zstd, read through src/server/spectraStore.ts, and the connection
// loads the extension. tableNames lists such a table under its own name.
// sqlite-zstd v0.3.5 reads a dictionary with an unqualified "select dict
// from _zstd_dicts where id = ?", which finds the main file's dictionaries
// only (or, when the main file has none, the attached file's): the BLOB
// views of a compressed TopFD file attached to a compressed TopPIC file
// would fail ("getting dict with id=15 from _zstd_dicts"). So a compressed
// attached file also gets a connection of its own (attachedFileDb), which
// spectraStore reads its BLOB tables through.

import { DatabaseSync } from 'node:sqlite';
import { CODEC_TABLE } from './zstd/codec';
import { isZstdFile, loadZstdExtension } from './zstd/extension';

/** The schema name of the attached TopFD file. */
export const TOPFD_SCHEMA = 'topfd';

/**
 * Open a dataset's files read only: toppicPath as the main database with
 * topfdPath attached, or whichever of the two is given alone; with the
 * sqlite-zstd extension loaded when one of them is compressed (throws when
 * the extension is not available).
 */
export function openSqlitePair(topfdPath: string | null, toppicPath: string | null): DatabaseSync {
  const mainPath = toppicPath ?? topfdPath;
  if (mainPath === null) throw new Error('no sqlite file');
  const attachPath = toppicPath !== null ? topfdPath : null;
  const attachCompressed = attachPath !== null && isZstdFile(attachPath);
  const compressed = isZstdFile(mainPath) || attachCompressed;
  const db = new DatabaseSync(mainPath, { readOnly: true, allowExtension: compressed });
  let side: DatabaseSync | null = null;
  try {
    if (compressed) loadZstdExtension(db);
    if (attachPath !== null) db.prepare(`ATTACH DATABASE ? AS ${TOPFD_SCHEMA}`).run(attachPath);
    if (attachCompressed) {
      side = new DatabaseSync(attachPath!, { readOnly: true, allowExtension: true });
      loadZstdExtension(side);
    }
  } catch (err) {
    side?.close();
    db.close();
    throw err;
  }
  if (side) {
    const attached = side;
    attachedDbs.set(db, attached);
    // the callers close the pair's connection only: close both
    const closeMain = db.close.bind(db);
    db.close = () => {
      try { attached.close(); } catch { /* closed already */ }
      closeMain();
    };
  }
  return db;
}

const attachedDbs = new WeakMap<DatabaseSync, DatabaseSync>();

/**
 * The attached TopFD file's own connection when that file is compressed
 * (see the file comment), else null: its BLOB tables are read as main.<table>_blob there.
 */
export function attachedFileDb(db: DatabaseSync): DatabaseSync | null {
  return attachedDbs.get(db) ?? null;
}

/** Whether the connection has the TopFD file attached. */
export function hasTopfdSchema(db: DatabaseSync): boolean {
  const rows = db.prepare('PRAGMA database_list').all() as { name: string }[];
  return rows.some((r) => r.name === TOPFD_SCHEMA);
}

/** The tables of one schema of the connection ('main' or TOPFD_SCHEMA), as stored. */
export function schemaTableNames(db: DatabaseSync, schema: string): Set<string> {
  return new Set(
    (db.prepare(`SELECT name FROM ${schema}.sqlite_master WHERE type = 'table'`).all() as { name: string }[])
      .map((r) => r.name),
  );
}

/** The per-spectrum tables one schema stores as BLOB rows (a compressed file), by their own names. */
export function blobTableNames(db: DatabaseSync, schema: string): Set<string> {
  if (!schemaTableNames(db, schema).has(CODEC_TABLE)) return new Set();
  return new Set((db.prepare(`SELECT DISTINCT tbl FROM ${schema}.${CODEC_TABLE}`).all() as { tbl: string }[])
    .map((r) => r.tbl));
}

/**
 * The tables of a file of the connection: those stored and those stored as
 * BLOB rows (src/server/spectraStore.ts).
 */
export function fileTableNames(db: DatabaseSync, schema: string): Set<string> {
  const names = schemaTableNames(db, schema);
  for (const name of blobTableNames(db, schema)) names.add(name);
  return names;
}

/** The tables an unqualified name can resolve to: those of every file of the connection. */
export function tableNames(db: DatabaseSync): Set<string> {
  const names = fileTableNames(db, 'main');
  if (hasTopfdSchema(db)) {
    for (const name of fileTableNames(db, TOPFD_SCHEMA)) names.add(name);
  }
  return names;
}
