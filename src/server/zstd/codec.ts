// The arrays of the BLOB layout (toppic_test experiment 171): the rows of a
// per-peak or per-envelope table of one spectrum as one BLOB per column,
// little-endian. A column's codec is chosen once for the whole table:
//   f4 / f8         float32 when every value is exactly a float32, else float64
//   i1 / i2 / i4    integers in the smallest type that holds them
//   seq             not stored: the values are 0, 1, ..., n - 1 in every
//                   spectrum (peak_id, env_id)
//   seqg            not stored: the values are 0, 1, ... in each run of rows
//                   with the same group value (an envelope peak's peak_id,
//                   restarting with every env_id)
// Readers decode with decodeColumn; values are JavaScript numbers, equal to
// the ones SQLite returns for the source rows.

export type Codec = 'f4' | 'f8' | 'i1' | 'i2' | 'i4' | 'seq' | 'seqg';

/** The per-spectrum tables the converter stores as <table>_blob (src/server/zstd/compress.ts). */
export const SPECTRUM_TABLES = ['ms1_peak', 'ms2_peak', 'ms1_env', 'ms1_env_peak', 'ms2_env', 'ms2_env_peak'];
export const BLOB_SUFFIX = '_blob';
/** The columns of each <table>_blob: tbl, col, pos, decl_type, codec ('key': spec_id), group_col, min_value, max_value. */
export const CODEC_TABLE = 'zstd_blob_columns';

/** Tracks one column's values over a table to choose its codec. */
export class CodecChooser {
  private allInt = true;
  private allF4 = true;
  private min = Infinity;
  private max = -Infinity;
  private seq = true;
  private pos = 0;           // position of the value in its spectrum
  private seqg = true;
  private gpos = 0;          // position of the value in its group
  private group: unknown = undefined;

  /** Start the values of a new spectrum. */
  nextSpectrum(): void {
    this.pos = 0;
    this.group = undefined;
  }

  /** The smallest and the largest value (0, 0 without values). */
  range(): { min: number; max: number } {
    return this.min === Infinity ? { min: 0, max: 0 } : { min: this.min, max: this.max };
  }

  /** Add the next value of the spectrum; group: the row's group value (for seqg). */
  add(v: number | bigint | null, group?: unknown): void {
    if (typeof v !== 'number') throw new Error(`unsupported value ${String(v)} (only non-null numbers are stored)`);
    if (this.allInt && !Number.isInteger(v)) this.allInt = false;
    if (this.allF4 && Math.fround(v) !== v) this.allF4 = false;
    if (v < this.min) this.min = v;
    if (v > this.max) this.max = v;
    if (this.seq && v !== this.pos) this.seq = false;
    this.pos++;
    if (group !== this.group || this.pos === 1) {
      this.group = group;
      this.gpos = 0;
    }
    if (this.seqg && v !== this.gpos) this.seqg = false;
    this.gpos++;
  }

  /**
   * The codec; integer columns declared INTEGER, others float (REAL). An id
   * column may be left out (seq, or seqg when grouped is set: its values were
   * added with their group).
   */
  codec(declaredInteger: boolean, idColumn: boolean, grouped = false): Codec {
    if (declaredInteger && this.allInt) {
      if (idColumn && this.seq) return 'seq';
      if (idColumn && grouped && this.seqg) return 'seqg';
      const lo = this.min === Infinity ? 0 : this.min;
      const hi = this.max === -Infinity ? 0 : this.max;
      if (lo >= -128 && hi <= 127) return 'i1';
      if (lo >= -32768 && hi <= 32767) return 'i2';
      if (lo >= -2147483648 && hi <= 2147483647) return 'i4';
      throw new Error(`integer values out of the 32-bit range (${lo} - ${hi})`);
    }
    return this.allF4 ? 'f4' : 'f8';
  }
}

/** The bytes of one column of one spectrum (null for seq / seqg, which are not stored). */
export function encodeColumn(codec: Codec, values: number[]): Uint8Array | null {
  let a: Float32Array | Float64Array | Int8Array | Int16Array | Int32Array;
  switch (codec) {
    case 'seq': case 'seqg': return null;
    case 'f4': a = Float32Array.from(values); break;
    case 'f8': a = Float64Array.from(values); break;
    case 'i1': a = Int8Array.from(values); break;
    case 'i2': a = Int16Array.from(values); break;
    case 'i4': a = Int32Array.from(values); break;
  }
  return new Uint8Array(a.buffer, a.byteOffset, a.byteLength);
}

const WIDTH: Record<Exclude<Codec, 'seq' | 'seqg'>, number> = { f4: 4, f8: 8, i1: 1, i2: 2, i4: 4 };

/**
 * The values of one column of one spectrum; n is the spectrum's row count
 * (for seq), groups the values of the group column (for seqg).
 */
export function decodeColumn(codec: Codec, bytes: Uint8Array | null, n: number,
  groups?: ArrayLike<number>): ArrayLike<number> {
  if (codec === 'seq') {
    const a = new Array<number>(n);
    for (let i = 0; i < n; i++) a[i] = i;
    return a;
  }
  if (codec === 'seqg') {
    if (!groups) throw new Error('seqg needs the group column');
    const a = new Array<number>(n);
    let k = 0;
    for (let i = 0; i < n; i++) {
      k = i > 0 && groups[i] === groups[i - 1] ? k + 1 : 0;
      a[i] = k;
    }
    return a;
  }
  if (!bytes || bytes.byteLength === 0) return [];
  // copy to an aligned buffer: SQLite's buffer may start at any offset
  const buf = bytes.slice().buffer;
  switch (codec) {
    case 'f4': return new Float32Array(buf);
    case 'f8': return new Float64Array(buf);
    case 'i1': return new Int8Array(buf);
    case 'i2': return new Int16Array(buf);
    case 'i4': return new Int32Array(buf);
  }
}

/** The number of values in a stored column. */
export function valueCount(codec: Exclude<Codec, 'seq' | 'seqg'>, bytes: Uint8Array | null): number {
  return bytes ? bytes.byteLength / WIDTH[codec] : 0;
}
