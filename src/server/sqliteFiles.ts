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

import { DatabaseSync } from 'node:sqlite';

/** The schema name of the attached TopFD file. */
export const TOPFD_SCHEMA = 'topfd';

/**
 * Open a dataset's files read only: toppicPath as the main database with
 * topfdPath attached, or whichever of the two is given alone.
 */
export function openSqlitePair(topfdPath: string | null, toppicPath: string | null): DatabaseSync {
  const mainPath = toppicPath ?? topfdPath;
  if (mainPath === null) throw new Error('no sqlite file');
  const db = new DatabaseSync(mainPath, { readOnly: true });
  if (toppicPath !== null && topfdPath !== null) {
    try {
      db.prepare(`ATTACH DATABASE ? AS ${TOPFD_SCHEMA}`).run(topfdPath);
    } catch (err) {
      db.close();
      throw err;
    }
  }
  return db;
}

/** Whether the connection has the TopFD file attached. */
export function hasTopfdSchema(db: DatabaseSync): boolean {
  const rows = db.prepare('PRAGMA database_list').all() as { name: string }[];
  return rows.some((r) => r.name === TOPFD_SCHEMA);
}

/** The tables of one schema of the connection ('main' or TOPFD_SCHEMA). */
export function schemaTableNames(db: DatabaseSync, schema: string): Set<string> {
  return new Set(
    (db.prepare(`SELECT name FROM ${schema}.sqlite_master WHERE type = 'table'`).all() as { name: string }[])
      .map((r) => r.name),
  );
}

/** The tables an unqualified name can resolve to: those of every file of the connection. */
export function tableNames(db: DatabaseSync): Set<string> {
  const names = schemaTableNames(db, 'main');
  if (hasTopfdSchema(db)) {
    for (const name of schemaTableNames(db, TOPFD_SCHEMA)) names.add(name);
  }
  return names;
}
