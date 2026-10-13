// The converter of toppic_test experiment 171: a TopFD, TopDIA, TopPIC or
// TopMG sqlite file rewritten with its per-peak and per-envelope tables as
// one BLOB row per spectrum, compressed by the sqlite-zstd extension.
//
// For each of the tables ms1_peak, ms2_peak, ms1_env, ms1_env_peak, ms2_env
// and ms2_env_peak that the file has, the new file has
//   <table>_blob(spec_id INTEGER PRIMARY KEY, n INTEGER NOT NULL, <column> BLOB, ...)
// with the spectrum's n rows as one array per column (codec.ts), in the
// order the source keeps them: rowid order, or for a WITHOUT ROWID table
// (TopFD's merged ms1_peak, key LEVEL, spec_id, peak_id) the order of the
// key without LEVEL; for TopFD's files that is the key order (peak_id;
// env_id; env_id, peak_id). An id column whose values are 0, 1, ... in every
// spectrum (seq), or in every envelope for an envelope peak's peak_id
// (seqg), is not stored. zstd_blob_columns(tbl, col, pos, decl_type, codec,
// group_col, min_value, max_value) records every column of the source table
// in its order (spec_id with the codec 'key'), so that readers rebuild the
// source rows exactly (src/server/spectraStore.ts), and each column's range
// (the 3D view's LEVEL range without reading the peaks). Every other table is copied as it is, with
// its explicit indexes. Then sqlite-zstd compresses every BLOB column with a
// dictionary of its own (each <table>_blob becomes a view that decompresses
// on read), and the file is VACUUMed. The source file is opened read only
// (sourceUri) and not changed.

import * as fs from 'fs';
import * as path from 'path';
import { DatabaseSync } from 'node:sqlite';
import { BLOB_SUFFIX, CODEC_TABLE, CodecChooser, Codec, encodeColumn, SPECTRUM_TABLES } from './codec';
import { loadZstdExtension } from './extension';
const ID_COLUMNS = new Set(['peak_id', 'env_id']);
// sqlite-zstd trains a dictionary of 1% of a column's data and, by default,
// none (the column stays uncompressed) when that would be under 5,000 bytes,
// i.e. for a column under 500 kB, as the envelope columns of a small run
// (toppic_test experiment 171: st_1's TopFD file 35.1 MB that way, 34.5 MB
// with dictionaries from 256 bytes, zstd's smallest)
const MIN_DICT_BYTES = 256;
// an envelope peak's peak_id restarts with every envelope
const GROUP_OF: Record<string, string> = { peak_id: 'env_id' };

export interface CompressOptions {
  level?: number;                       // zstd level, default 3
  onProgress?: (msg: string) => void;
  logLevel?: string;                    // the extension's log level (SQLITE_ZSTD_LOG), default error
}

/** One BLOB column: its arrays' bytes before and after compression, its dictionary's bytes (0: none, stored as is). */
export interface ColumnSize { table: string; column: string; raw: number; stored: number; dict: number }

export interface TableReport {
  table: string;
  rows: number;
  spectra: number;
  columns: { name: string; codec: Codec | 'key'; min?: number; max?: number }[];
}

export interface CompressReport {
  tables: TableReport[];
  copied: string[];
  columns: ColumnSize[];
  seconds: { blobs: number; compress: number; vacuum: number };
  bytes: { source: number; output: number };
}

/**
 * A file: URI that opens a database read only: as immutable (no side files),
 * unless it has a write-ahead log with content (TopFD and TopPIC write WAL
 * files and checkpoint them on close), which an immutable open would ignore.
 */
export function sourceUri(p: string): string {
  const abs = path.resolve(p).replace(/\\/g, '/').replace(/[%?#]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase());
  const wal = p + '-wal';
  const mode = fs.existsSync(wal) && fs.statSync(wal).size > 0 ? 'mode=ro' : 'immutable=1';
  return 'file:' + (/^[A-Za-z]:/.test(abs) ? '///' : '') + abs + '?' + mode;
}

function q(name: string): string {
  return '"' + name.replace(/"/g, '""') + '"';
}

function removeDb(p: string): void {
  for (const s of ['', '-journal', '-wal', '-shm']) fs.rmSync(p + s, { force: true });
}

interface ColumnInfo { name: string; type: string; pk: number }

/** The column order of a table's rows within a spectrum (see the file comment). */
function rowOrder(src: DatabaseSync, table: string, cols: ColumnInfo[]): string {
  const sql = (src.prepare('SELECT sql FROM src.sqlite_master WHERE type = \'table\' AND name = ?').get(table) as
    { sql: string }).sql;
  if (!/WITHOUT\s+ROWID/i.test(sql)) return 'spec_id, rowid';
  const key = cols.filter((c) => c.pk > 0 && c.name !== 'spec_id' && c.name.toUpperCase() !== 'LEVEL')
    .sort((a, b) => a.pk - b.pk).map((c) => q(c.name));
  return ['spec_id', ...key].join(', ');
}

/**
 * Write outPath from the database srcPath (an earlier outPath is replaced).
 * Throws when the extension is missing, the source is compressed already, or
 * a per-spectrum table holds a value the arrays cannot store (NULL, text,
 * integers beyond 32 bits).
 */
export function compressDatabase(srcPath: string, outPath: string, opts: CompressOptions = {}): CompressReport {
  const level = opts.level ?? 3;
  const progress = opts.onProgress ?? (() => undefined);
  if (path.resolve(srcPath) === path.resolve(outPath)) throw new Error('the output file must differ from the input file');
  removeDb(outPath);
  // rows are copied as they are: TopDIA's MS/MS windows have ms1_id -1,
  // which ms2_spectrum's foreign key would refuse (node:sqlite enforces
  // foreign keys by default, TopFD's writer does not)
  const db = new DatabaseSync(outPath, { allowExtension: true, enableForeignKeyConstraints: false });
  const report: CompressReport = {
    tables: [], copied: [], columns: [], seconds: { blobs: 0, compress: 0, vacuum: 0 },
    bytes: { source: fs.statSync(srcPath).size, output: 0 },
  };
  try {
    // each column it compresses makes the extension warn that it recommends
    // auto_vacuum (the file is VACUUMed once instead) and a busy timeout
    loadZstdExtension(db, { logLevel: opts.logLevel ?? 'error', need: 'compressing needs sqlite-zstd' });
    db.exec('PRAGMA journal_mode = OFF; PRAGMA synchronous = OFF;');
    db.prepare('ATTACH DATABASE ? AS src').run(sourceUri(srcPath));
    const srcTables = db.prepare("SELECT name, sql FROM src.sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY rowid")
      .all() as { name: string; sql: string }[];
    if (srcTables.some((t) => t.name === '_zstd_configs')) throw new Error(`${srcPath} is compressed already`);

    // 1. the other tables as they are, with their explicit indexes
    const t0 = Date.now();
    db.exec('BEGIN');
    for (const t of srcTables) {
      if (SPECTRUM_TABLES.includes(t.name)) continue;
      db.exec(t.sql);
      const wr = /WITHOUT\s+ROWID/i.test(t.sql);
      db.exec(`INSERT INTO main.${q(t.name)} SELECT * FROM src.${q(t.name)}${wr ? '' : ' ORDER BY rowid'}`);
      report.copied.push(t.name);
    }
    const indexes = db.prepare("SELECT tbl_name, sql FROM src.sqlite_master WHERE type = 'index' AND sql IS NOT NULL")
      .all() as { tbl_name: string; sql: string }[];
    for (const ix of indexes) {
      if (report.copied.includes(ix.tbl_name)) db.exec(ix.sql);
    }
    db.exec(`CREATE TABLE ${CODEC_TABLE}(tbl TEXT NOT NULL, col TEXT NOT NULL, pos INTEGER NOT NULL, `
      + 'decl_type TEXT NOT NULL, codec TEXT NOT NULL, group_col TEXT, min_value REAL, max_value REAL, '
      + 'PRIMARY KEY(tbl, col))');
    db.exec('COMMIT');

    // 2. the per-spectrum tables as BLOB rows
    for (const t of srcTables) {
      if (!SPECTRUM_TABLES.includes(t.name)) continue;
      const cols = db.prepare(`PRAGMA src.table_info(${q(t.name)})`).all() as unknown as ColumnInfo[];
      if (!cols.some((c) => c.name === 'spec_id')) throw new Error(`${t.name} has no spec_id column`);
      const data = cols.filter((c) => c.name !== 'spec_id');
      const names = new Set(cols.map((c) => c.name));
      const groupCol = data.map((c) => (names.has(GROUP_OF[c.name]) ? GROUP_OF[c.name] : null));
      const select = `SELECT ${cols.map((c) => q(c.name)).join(', ')} FROM src.${q(t.name)} ORDER BY ${rowOrder(db, t.name, cols)}`;
      progress(`${t.name}: choosing the codecs`);
      const choosers = data.map(() => new CodecChooser());
      let spec: number | null = null;
      let rows = 0;
      let spectra = 0;
      for (const r of db.prepare(select).iterate() as Iterable<Record<string, number>>) {
        if (r.spec_id !== spec) {
          spec = r.spec_id;
          spectra++;
          for (const c of choosers) c.nextSpectrum();
        }
        data.forEach((c, i) => choosers[i].add(r[c.name], groupCol[i] === null ? undefined : r[groupCol[i]!]));
        rows++;
      }
      const codecs = data.map((c, i) => choosers[i].codec(/INT/i.test(c.type), ID_COLUMNS.has(c.name), groupCol[i] !== null));
      const stored = data.filter((_, i) => codecs[i] !== 'seq' && codecs[i] !== 'seqg');
      const blob = t.name + BLOB_SUFFIX;
      db.exec(`CREATE TABLE ${q(blob)}(spec_id INTEGER PRIMARY KEY, n INTEGER NOT NULL`
        + stored.map((c) => `, ${q(c.name)} BLOB NOT NULL`).join('') + ')');
      const insCodec = db.prepare(`INSERT INTO ${CODEC_TABLE} VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
      cols.forEach((c, pos) => {
        const k = data.indexOf(c);
        if (k < 0) {
          insCodec.run(t.name, c.name, pos, c.type, 'key', null, null, null);
        } else {
          const { min, max } = choosers[k].range();
          insCodec.run(t.name, c.name, pos, c.type, codecs[k], codecs[k] === 'seqg' ? groupCol[k] : null, min, max);
        }
      });
      progress(`${t.name}: ${rows.toLocaleString()} rows of ${spectra.toLocaleString()} spectra, codecs `
        + data.map((c, i) => `${c.name} ${codecs[i]}`).join(', '));
      const ins = db.prepare(`INSERT INTO ${q(blob)} VALUES (?, ?${', ?'.repeat(stored.length)})`);
      const rawBytes = data.map(() => 0);
      let arrays: number[][] = data.map(() => []);
      let n = 0;
      const flush = () => {
        if (spec === null || n === 0) return;
        const args: (number | Uint8Array)[] = [spec, n];
        data.forEach((_, i) => {
          const b = encodeColumn(codecs[i], arrays[i]);
          if (b) {
            args.push(b);
            rawBytes[i] += b.byteLength;
          }
        });
        ins.run(...args);
      };
      db.exec('BEGIN');
      spec = null;
      for (const r of db.prepare(select).iterate() as Iterable<Record<string, number>>) {
        if (r.spec_id !== spec) {
          flush();
          spec = r.spec_id;
          arrays = data.map(() => []);
          n = 0;
        }
        data.forEach((c, i) => arrays[i].push(r[c.name]));
        n++;
      }
      flush();
      db.exec('COMMIT');
      data.forEach((c, i) => {
        if (codecs[i] !== 'seq' && codecs[i] !== 'seqg') {
          report.columns.push({ table: blob, column: c.name, raw: rawBytes[i], stored: 0, dict: 0 });
        }
      });
      report.tables.push({
        table: t.name, rows, spectra,
        columns: cols.map((c) => {
          const k = data.indexOf(c);
          return k < 0 ? { name: c.name, codec: 'key' as const } : { name: c.name, codec: codecs[k], ...choosers[k].range() };
        }),
      });
    }
    db.exec('DETACH DATABASE src');
    report.seconds.blobs = (Date.now() - t0) / 1000;

    // 3. sqlite-zstd: one dictionary per BLOB column
    const t1 = Date.now();
    db.exec('PRAGMA journal_mode = WAL');
    for (const t of report.tables) {
      const blob = t.table + BLOB_SUFFIX;
      for (const c of t.columns) {
        if (c.codec === 'key' || c.codec === 'seq' || c.codec === 'seqg') continue;
        progress(`compressing ${blob}.${c.name}`);
        const cfg = {
          table: blob, column: c.name, compression_level: level, dict_chooser: `'${blob}.${c.name}'`,
          min_dict_size_bytes_for_training: MIN_DICT_BYTES,
        };
        db.prepare('SELECT zstd_enable_transparent(?)').get(JSON.stringify(cfg));
        // v0.3.5 names the index of the dictionary column after the column
        // only (_<column>_dict_idx), which clashes between tables with a
        // column of the same name; name it after the table too
        db.exec(`DROP INDEX ${q(`_${c.name}_dict_idx`)}`);
        db.exec(`CREATE INDEX ${q(`_${blob}_${c.name}_dict_idx`)} ON ${q(`_${blob}_zstd`)}(${q(`_${c.name}_dict`)})`);
      }
    }
    db.prepare('SELECT zstd_incremental_maintenance(NULL, 1)').get();
    report.seconds.compress = (Date.now() - t1) / 1000;
    // the sizes stored: a column of a compressed table is _<table>_zstd.<column>,
    // with its dictionary's id in _<column>_dict (NULL: stored as is)
    for (const c of report.columns) {
      const r = db.prepare(`SELECT SUM(LENGTH(${q(c.column)})) AS b, MAX(${q(`_${c.column}_dict`)}) AS d `
        + `FROM ${q(`_${c.table}_zstd`)}`).get() as { b: number | null; d: number | null };
      c.stored = r.b ?? 0;
      if (r.d !== null) {
        c.dict = (db.prepare('SELECT LENGTH(dict) AS n FROM _zstd_dicts WHERE id = ?').get(r.d) as { n: number }).n;
      }
    }
    const t2 = Date.now();
    db.exec('PRAGMA wal_checkpoint(TRUNCATE)');
    db.exec('PRAGMA journal_mode = DELETE');
    db.exec('VACUUM');
    report.seconds.vacuum = (Date.now() - t2) / 1000;
  } catch (err) {
    db.close();
    removeDb(outPath);
    throw err;
  }
  db.close();
  report.bytes.output = fs.statSync(outPath).size;
  return report;
}
