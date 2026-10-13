// A read-only reader of an SQLite file chosen on the home page (a File), for
// the checks of the upload form (upload_check.ts) before anything is
// uploaded: enough of the file format (https://www.sqlite.org/fileformat2.html)
// to read the schema and the rows of rowid tables, every row or one by its
// rowid. Only the pages a read needs are read (File.slice, in chunks of
// 1 MB, the last few cached), so a file of several GB is never loaded whole.
// Compiled with home.ts into public/common/js (script globals, no modules).

/** A value of a record: NULL, an integer or a real, a text or a blob. */
type SqlValue = null | number | string | Uint8Array;

/** A rowid table (or a WITHOUT ROWID table, whose rows this reader cannot read). */
interface SqliteTable {
  name: string;
  rootPage: number;
  columns: string[];           // in the order of CREATE TABLE
  rowidColumn: number;         // the INTEGER PRIMARY KEY column (stored as the rowid), or -1
  withoutRowid: boolean;
}

const SQLITE_HEADER = 'SQLite format 3\u0000';
const SQLITE_CHUNK_BYTES = 1 << 20;
const SQLITE_CACHED_CHUNKS = 16;
const SQLITE_TABLE_INTERIOR = 0x05;
const SQLITE_TABLE_LEAF = 0x0d;

/** The varint at b[at]: its value and the offset after it. */
function sqliteVarint(b: Uint8Array, at: number): [number, number] {
  let v = 0;
  for (let i = 0; i < 8; i++) {
    const c = b[at + i];
    v = v * 128 + (c & 0x7f);
    if (c < 0x80) return [v, at + i + 1];
  }
  return [v * 256 + b[at + 8], at + 9];
}

/**
 * The columns of a CREATE TABLE statement: their names in order, the
 * INTEGER PRIMARY KEY column (an alias of the rowid, NULL in the record) and
 * whether the table is WITHOUT ROWID. Table constraints are skipped.
 */
function sqliteTableColumns(sql: string): { columns: string[]; rowidColumn: number; withoutRowid: boolean } {
  const parts: string[] = [];
  let depth = 0;
  let start = -1;
  let end = sql.length;
  for (let i = 0; i < sql.length; i++) {
    const c = sql[i];
    if (c === '\'' || c === '"' || c === '`' || c === '[') {
      const close = sql.indexOf(c === '[' ? ']' : c, i + 1);
      i = close < 0 ? sql.length : close;
    } else if (c === '(') {
      if (++depth === 1) start = i + 1;
    } else if (c === ')') {
      if (--depth === 0) {
        parts.push(sql.slice(start, i));
        end = i + 1;
        break;
      }
    } else if (c === ',' && depth === 1) {
      parts.push(sql.slice(start, i));
      start = i + 1;
    }
  }
  const columns: string[] = [];
  let rowidColumn = -1;
  for (const part of parts) {
    const def = part.trim();
    if (/^(CONSTRAINT|PRIMARY|UNIQUE|CHECK|FOREIGN)\b/i.test(def)) continue;
    const m = def.match(/^("[^"]*"|`[^`]*`|\[[^\]]*\]|\S+)\s*([\s\S]*)$/);
    if (!m) continue;
    const name = m[1].replace(/^["`[]|["`\]]$/g, '');
    if (/^INTEGER\b/i.test(m[2]) && /\bPRIMARY\s+KEY\b/i.test(m[2])) rowidColumn = columns.length;
    columns.push(name);
  }
  return { columns, rowidColumn, withoutRowid: /^\s*WITHOUT\s+ROWID\b/i.test(sql.slice(end)) };
}

/** One b-tree page: its bytes, type, cell offsets (in key order) and right-most child. */
interface SqliteBtreePage {
  bytes: Uint8Array;
  view: DataView;
  leaf: boolean;
  cells: number[];
  right: number;
}

class SqliteFileReader {
  private chunks = new Map<number, Uint8Array>();
  private schema: { type: string; name: string; rootPage: number; sql: string }[] | null = null;

  private constructor(readonly file: File, private pageSize: number, private usableSize: number,
                      private decoder: TextDecoder) {}

  /** Opens an SQLite file; throws when the file is not one. */
  static async open(file: File): Promise<SqliteFileReader> {
    const head = new Uint8Array(await file.slice(0, 100).arrayBuffer());
    if (head.length < 100 || new TextDecoder().decode(head.subarray(0, 16)) !== SQLITE_HEADER) {
      throw new Error('it is not an SQLite file');
    }
    const view = new DataView(head.buffer);
    const raw = view.getUint16(16);
    const pageSize = raw === 1 ? 65536 : raw;
    if (pageSize < 512 || (pageSize & (pageSize - 1)) !== 0) throw new Error('it is not a valid SQLite file');
    const encoding = view.getUint32(56);
    const decoder = new TextDecoder(encoding === 2 ? 'utf-16le' : encoding === 3 ? 'utf-16be' : 'utf-8');
    return new SqliteFileReader(file, pageSize, pageSize - head[20], decoder);
  }

  private async page(n: number): Promise<Uint8Array> {
    const offset = (n - 1) * this.pageSize;
    if (n < 1 || offset + this.pageSize > this.file.size) {
      throw new Error(`the SQLite file is truncated or damaged (no page ${n})`);
    }
    const index = Math.floor(offset / SQLITE_CHUNK_BYTES);
    let chunk = this.chunks.get(index);
    if (chunk) {
      this.chunks.delete(index);
    } else {
      const start = index * SQLITE_CHUNK_BYTES;
      const blob = this.file.slice(start, Math.min(this.file.size, start + SQLITE_CHUNK_BYTES));
      chunk = new Uint8Array(await blob.arrayBuffer());
      if (this.chunks.size >= SQLITE_CACHED_CHUNKS) this.chunks.delete(this.chunks.keys().next().value as number);
    }
    this.chunks.set(index, chunk);
    const at = offset - index * SQLITE_CHUNK_BYTES;
    return chunk.subarray(at, at + this.pageSize);
  }

  private async btreePage(n: number): Promise<SqliteBtreePage> {
    const bytes = await this.page(n);
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const h = n === 1 ? 100 : 0;      // page 1 starts with the file header
    const type = bytes[h];
    if (type !== SQLITE_TABLE_LEAF && type !== SQLITE_TABLE_INTERIOR) {
      throw new Error(`the SQLite file is damaged (page ${n} is not a table page)`);
    }
    const leaf = type === SQLITE_TABLE_LEAF;
    const first = h + (leaf ? 8 : 12);
    const cells = new Array<number>(view.getUint16(h + 3));
    for (let i = 0; i < cells.length; i++) cells[i] = view.getUint16(first + 2 * i);
    return { bytes, view, leaf, cells, right: leaf ? 0 : view.getUint32(h + 8) };
  }

  // the rowid of a leaf cell, or the key of an interior cell
  private cellKey(pg: SqliteBtreePage, i: number): number {
    const at = pg.cells[i];
    return pg.leaf ? sqliteVarint(pg.bytes, sqliteVarint(pg.bytes, at)[1])[0] : sqliteVarint(pg.bytes, at + 4)[0];
  }

  // the rowid and the record of a leaf cell, with its overflow pages
  private async leafCell(pg: SqliteBtreePage, i: number): Promise<{ rowid: number; record: Uint8Array }> {
    let [size, at] = sqliteVarint(pg.bytes, pg.cells[i]);
    let rowid: number;
    [rowid, at] = sqliteVarint(pg.bytes, at);
    const u = this.usableSize;
    const maxLocal = u - 35;
    if (size <= maxLocal) return { rowid, record: pg.bytes.subarray(at, at + size) };
    const minLocal = Math.floor(((u - 12) * 32) / 255) - 23;
    const k = minLocal + ((size - minLocal) % (u - 4));
    const local = k <= maxLocal ? k : minLocal;
    const record = new Uint8Array(size);
    record.set(pg.bytes.subarray(at, at + local));
    let next = pg.view.getUint32(at + local);
    for (let filled = local; filled < size;) {
      if (next === 0) throw new Error('the SQLite file is damaged (a record is cut short)');
      const ov = await this.page(next);
      const n = Math.min(size - filled, u - 4);
      record.set(ov.subarray(4, 4 + n), filled);
      filled += n;
      next = new DataView(ov.buffer, ov.byteOffset, 4).getUint32(0);
    }
    return { rowid, record };
  }

  private decodeRecord(record: Uint8Array): SqlValue[] {
    const view = new DataView(record.buffer, record.byteOffset, record.byteLength);
    const [headerSize, first] = sqliteVarint(record, 0);
    const values: SqlValue[] = [];
    let body = headerSize;
    for (let at = first; at < headerSize;) {
      let t: number;
      [t, at] = sqliteVarint(record, at);
      switch (t) {
        case 0: values.push(null); break;
        case 1: values.push(view.getInt8(body)); body += 1; break;
        case 2: values.push(view.getInt16(body)); body += 2; break;
        case 3: values.push(view.getInt8(body) * 65536 + view.getUint16(body + 1)); body += 3; break;
        case 4: values.push(view.getInt32(body)); body += 4; break;
        case 5: values.push(view.getInt16(body) * 4294967296 + view.getUint32(body + 2)); body += 6; break;
        case 6: values.push(view.getInt32(body) * 4294967296 + view.getUint32(body + 4)); body += 8; break;
        case 7: values.push(view.getFloat64(body)); body += 8; break;
        case 8: values.push(0); break;
        case 9: values.push(1); break;
        default: {
          if (t < 12) throw new Error('the SQLite file is damaged (unknown value type)');
          const len = (t - (t % 2 === 0 ? 12 : 13)) / 2;
          const bytes = record.subarray(body, body + len);
          values.push(t % 2 === 0 ? bytes : this.decoder.decode(bytes));
          body += len;
        }
      }
    }
    return values;
  }

  // the rows of the table b-tree rooted at page n, in rowid order
  private async scan(n: number, f: (rowid: number, values: SqlValue[]) => void): Promise<void> {
    const pg = await this.btreePage(n);
    if (pg.leaf) {
      for (let i = 0; i < pg.cells.length; i++) {
        const { rowid, record } = await this.leafCell(pg, i);
        f(rowid, this.decodeRecord(record));
      }
      return;
    }
    for (const at of pg.cells) await this.scan(pg.view.getUint32(at), f);
    await this.scan(pg.right, f);
  }

  /** The tables, indexes, views and triggers of sqlite_master. */
  private async schemaRows(): Promise<{ type: string; name: string; rootPage: number; sql: string }[]> {
    if (this.schema === null) {
      const rows: { type: string; name: string; rootPage: number; sql: string }[] = [];
      await this.scan(1, (_, v) => rows.push({
        type: String(v[0]), name: String(v[1]), rootPage: Number(v[3] ?? 0), sql: v[4] == null ? '' : String(v[4]),
      }));
      this.schema = rows;
    }
    return this.schema;
  }

  /** The names of the tables, in lower case. */
  async tableNames(): Promise<Set<string>> {
    return new Set((await this.schemaRows()).filter((r) => r.type === 'table').map((r) => r.name.toLowerCase()));
  }

  /** A table by its name (case-insensitive, as SQLite's), or null. */
  async table(name: string): Promise<SqliteTable | null> {
    const row = (await this.schemaRows())
      .find((r) => r.type === 'table' && r.name.toLowerCase() === name.toLowerCase());
    if (!row) return null;
    return { name: row.name, rootPage: row.rootPage, ...sqliteTableColumns(row.sql) };
  }

  // the positions of the named columns in the table's records
  private columnIndexes(t: SqliteTable, columns: string[]): number[] {
    if (t.withoutRowid) throw new Error(`the table ${t.name} is a WITHOUT ROWID table`);
    const lower = t.columns.map((c) => c.toLowerCase());
    return columns.map((c) => {
      const i = lower.indexOf(c.toLowerCase());
      if (i < 0) throw new Error(`the table ${t.name} has no column ${c}`);
      return i;
    });
  }

  // the named columns of a record (an INTEGER PRIMARY KEY column is the rowid;
  // a column added after the row was written is NULL)
  private pick(t: SqliteTable, idx: number[], rowid: number, values: SqlValue[]): SqlValue[] {
    return idx.map((i) => (i === t.rowidColumn ? rowid : values[i] ?? null));
  }

  /** Calls f with the named columns of every row of a table, in rowid order. */
  async rows(t: SqliteTable, columns: string[], f: (values: SqlValue[], rowid: number) => void): Promise<void> {
    const idx = this.columnIndexes(t, columns);
    await this.scan(t.rootPage, (rowid, values) => f(this.pick(t, idx, rowid, values), rowid));
  }

  /** The named columns of the row of a table with the rowid, or null. */
  async row(t: SqliteTable, rowid: number, columns: string[]): Promise<SqlValue[] | null> {
    const idx = this.columnIndexes(t, columns);
    let pg = await this.btreePage(t.rootPage);
    for (;;) {
      // the first cell whose key is >= rowid
      let lo = 0;
      let hi = pg.cells.length;
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (this.cellKey(pg, mid) >= rowid) hi = mid; else lo = mid + 1;
      }
      if (pg.leaf) {
        if (lo === pg.cells.length || this.cellKey(pg, lo) !== rowid) return null;
        const { record } = await this.leafCell(pg, lo);
        return this.pick(t, idx, rowid, this.decodeRecord(record));
      }
      pg = await this.btreePage(lo < pg.cells.length ? pg.view.getUint32(pg.cells[lo]) : pg.right);
    }
  }

  /** The largest rowid of a table, or null for an empty table. */
  async lastRowid(t: SqliteTable): Promise<number | null> {
    let pg = await this.btreePage(t.rootPage);
    while (!pg.leaf) pg = await this.btreePage(pg.right);
    return pg.cells.length > 0 ? this.cellKey(pg, pg.cells.length - 1) : null;
  }
}
