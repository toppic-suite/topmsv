// The per-spectrum tables of a dataset's files (ms1_peak, ms2_peak, ms1_env,
// ms1_env_peak, ms2_env, ms2_env_peak) stored as rows or, in a file
// compressed by `npm run compress` (toppic_test experiment 171), as one
// BLOB row per spectrum: <table>_blob(spec_id, n, one array per column), a
// view of the sqlite-zstd extension, with the codecs and the source column
// order in zstd_blob_columns (src/server/zstd/codec.ts). Every read of these
// tables goes through here, so that a page or API answer is the same for
// either form: a table resolves as an unqualified name does (the main file
// first, then the attached TopFD file, src/server/sqliteFiles.ts), and BLOB
// rows are rebuilt into the source rows, in the source's order (rowid
// order; for TopFD's merged ms1_peak, peak_id order), with the columns the
// SQL of the row form would return. The BLOB views of a compressed attached
// TopFD file are read through that file's own connection
// (sqliteFiles.attachedFileDb).

import { DatabaseSync, StatementSync } from 'node:sqlite';
import { BLOB_SUFFIX, CODEC_TABLE, Codec, decodeColumn } from './zstd/codec';
import { attachedFileDb, hasTopfdSchema, schemaTableNames, TOPFD_SCHEMA } from './sqliteFiles';

export type Row = Record<string, number>;

export interface BlobColumn {
  name: string;
  codec: Codec | 'key';        // 'key': spec_id
  groupCol: string | null;     // seqg: the column whose runs restart the sequence
  min: number | null;          // the column's range over the table
  max: number | null;
}

/** A per-spectrum table stored as BLOB rows. */
export interface BlobTable {
  schema: string;              // the file: 'main' or TOPFD_SCHEMA
  table: string;               // the source table's name (ms1_peak, ...)
  columns: BlobColumn[];       // the source table's columns in order
  conn: DatabaseSync;          // the connection that reads the BLOB view
  from: string;                // the view's qualified name on conn
  byId: StatementSync;         // one spectrum's BLOB row
}

/** One spectrum of a BLOB table: its row count and every column decoded. */
export interface DecodedSpectrum {
  specId: number;
  n: number;
  values: Map<string, ArrayLike<number>>;
}

function q(name: string): string {
  return '"' + name.replace(/"/g, '""') + '"';
}

// where each table resolves, per connection: a BLOB table, or null for a row
// table (or none)
const resolved = new WeakMap<DatabaseSync, Map<string, BlobTable | null>>();

function blobTableOf(db: DatabaseSync, schema: string, table: string, columns: BlobColumn[]): BlobTable {
  const side = schema === TOPFD_SCHEMA ? attachedFileDb(db) : null;
  const conn = side ?? db;
  const from = `${side ? 'main' : schema}.${q(table + BLOB_SUFFIX)}`;
  return { schema, table, columns, conn, from, byId: conn.prepare(`SELECT * FROM ${from} WHERE spec_id = ?`) };
}

function codecRows(db: DatabaseSync, schema: string, table: string): BlobColumn[] {
  const rows = db.prepare(`SELECT col, codec, group_col, min_value, max_value FROM ${schema}.${CODEC_TABLE} `
    + 'WHERE tbl = ? ORDER BY pos').all(table) as
    { col: string; codec: Codec | 'key'; group_col: string | null; min_value: number | null; max_value: number | null }[];
  return rows.map((r) => ({ name: r.col, codec: r.codec, groupCol: r.group_col, min: r.min_value, max: r.max_value }));
}

/**
 * The BLOB table a per-spectrum table name resolves to, or null when it
 * resolves to a row table (or to nothing): the main file's BLOB or row
 * table first, then the attached TopFD file's.
 */
export function blobTable(db: DatabaseSync, table: string): BlobTable | null {
  let cache = resolved.get(db);
  if (!cache) {
    cache = new Map();
    resolved.set(db, cache);
  }
  if (cache.has(table)) return cache.get(table)!;
  let found: BlobTable | null = null;
  const schemas = hasTopfdSchema(db) ? ['main', TOPFD_SCHEMA] : ['main'];
  for (const schema of schemas) {
    const tables = schemaTableNames(db, schema);
    if (tables.has(CODEC_TABLE)) {
      const columns = codecRows(db, schema, table);
      if (columns.length > 0) {
        found = blobTableOf(db, schema, table, columns);
        break;
      }
    }
    if (tables.has(table)) break;     // a row table
  }
  cache.set(table, found);
  return found;
}

/** Decode one BLOB row (a row of <table>_blob). */
export function decodeBlobRow(bt: BlobTable, row: Record<string, unknown>): DecodedSpectrum {
  const n = row.n as number;
  const values = new Map<string, ArrayLike<number>>();
  // seqg columns after the columns they follow
  for (const pass of [false, true]) {
    for (const c of bt.columns) {
      if (c.codec === 'key' || (c.codec === 'seqg') !== pass) continue;
      const groups = c.groupCol === null ? undefined : values.get(c.groupCol);
      values.set(c.name, decodeColumn(c.codec, (row[c.name] as Uint8Array | undefined) ?? null, n, groups));
    }
  }
  return { specId: row.spec_id as number, n, values };
}

/** One spectrum of a BLOB table decoded, or null when it has no row (no data for the spectrum). */
export function decodedSpectrum(bt: BlobTable, specId: number): DecodedSpectrum | null {
  const row = bt.byId.get(specId) as Record<string, unknown> | undefined;
  return row ? decodeBlobRow(bt, row) : null;
}

/** The rows of a decoded spectrum with the given columns (all, in the source's order, when omitted). */
export function rowsOf(bt: BlobTable, dec: DecodedSpectrum, columns?: string[]): Row[] {
  const names = columns ?? bt.columns.map((c) => c.name);
  const arrays = names.map((name) => {
    if (name === 'spec_id') return null;
    const a = dec.values.get(name);
    if (!a) throw new Error(`${bt.table} has no column ${name}`);
    return a;
  });
  const rows: Row[] = new Array(dec.n);
  for (let i = 0; i < dec.n; i++) {
    const r: Row = {};
    names.forEach((name, k) => { r[name] = arrays[k] === null ? dec.specId : arrays[k]![i]; });
    rows[i] = r;
  }
  return rows;
}

export interface SpectrumRowsOptions {
  columns?: string[];          // the columns the SQL selects (default all, as SELECT *)
  orderBy?: string[];          // the SQL's ORDER BY columns, all ascending
}

/**
 * One spectrum's rows of a per-spectrum table: from a row table as `sql`
 * (its one parameter the spectrum id) returns them; from BLOB rows rebuilt
 * with opts.columns and sorted by opts.orderBy (stable: the source order
 * among ties, as SQLite returns rows read by the spec_id index).
 */
export function spectrumRows(db: DatabaseSync, table: string, specId: number, sql: string,
  opts: SpectrumRowsOptions = {}): Row[] {
  const bt = blobTable(db, table);
  if (!bt) return db.prepare(sql).all(specId) as Row[];
  const dec = decodedSpectrum(bt, specId);
  if (!dec) return [];
  const all = rowsOf(bt, dec);
  if (opts.orderBy && opts.orderBy.length > 0) {
    const keys = opts.orderBy;
    all.sort((a, b) => {
      for (const k of keys) {
        if (a[k] !== b[k]) return a[k] < b[k] ? -1 : 1;
      }
      return 0;
    });
  }
  if (!opts.columns) return all;
  const cols = opts.columns;
  return all.map((r) => {
    const out: Row = {};
    for (const c of cols) out[c] = r[c];
    return out;
  });
}

/** The column names of a per-spectrum table (as PRAGMA table_info lists them). */
export function spectrumColumns(db: DatabaseSync, table: string): string[] {
  const bt = blobTable(db, table);
  if (bt) return bt.columns.map((c) => c.name);
  return (db.prepare(`PRAGMA table_info(${q(table)})`).all() as { name: string }[]).map((c) => c.name);
}

/**
 * Every spectrum of a per-spectrum table of one file of the connection (not
 * resolved across files), in spec_id order, with the given columns. A row
 * table is read in rowid order (not for WITHOUT ROWID tables).
 */
export function* spectraOf(db: DatabaseSync, schema: string, table: string, columns: string[]):
  Generator<{ specId: number; values: ArrayLike<number>[] }> {
  const blobColumns = schemaTableNames(db, schema).has(CODEC_TABLE) ? codecRows(db, schema, table) : [];
  if (blobColumns.length > 0) {
    const bt = blobTableOf(db, schema, table, blobColumns);
    for (const row of bt.conn.prepare(`SELECT * FROM ${bt.from} ORDER BY spec_id`).iterate()) {
      const dec = decodeBlobRow(bt, row as Record<string, unknown>);
      yield { specId: dec.specId, values: columns.map((c) => dec.values.get(c)!) };
    }
    return;
  }
  const stmt = db.prepare(`SELECT spec_id, ${columns.map(q).join(', ')} FROM ${schema}.${q(table)} ORDER BY spec_id, rowid`);
  let spec: number | null = null;
  let values: number[][] = [];
  for (const r of stmt.iterate() as Iterable<Row>) {
    if (r.spec_id !== spec) {
      if (spec !== null) yield { specId: spec, values };
      spec = r.spec_id;
      values = columns.map(() => []);
    }
    columns.forEach((c, i) => values[i].push(r[c]));
  }
  if (spec !== null) yield { specId: spec, values };
}

/**
 * The column names of a per-spectrum table of one file of the connection
 * (not resolved across files; none when the file lacks the table).
 */
export function schemaSpectrumColumns(db: DatabaseSync, schema: string, table: string): string[] {
  const blob = schemaTableNames(db, schema).has(CODEC_TABLE) ? codecRows(db, schema, table) : [];
  if (blob.length > 0) return blob.map((c) => c.name);
  return (db.prepare(`PRAGMA ${schema}.table_info(${q(table)})`).all() as { name: string }[]).map((c) => c.name);
}

/** Whether a table of one file of the connection is stored as BLOB rows. */
export function isBlobInSchema(db: DatabaseSync, schema: string, table: string): boolean {
  return schemaTableNames(db, schema).has(CODEC_TABLE) && codecRows(db, schema, table).length > 0;
}
