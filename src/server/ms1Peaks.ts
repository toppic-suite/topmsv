// The MS1 peaks of a TopFD or TopDIA sqlite and the MS1 3D view's data over
// them (toppic_test experiment 165): one table
//   ms1_peak(LEVEL, spec_id, peak_id, mz, intensity) WITHOUT ROWID,
//   PRIMARY KEY(LEVEL, spec_id, peak_id)
// LEVEL is -1 for a peak outside the 3D map (intensity <= 0), else the
// highest level that keeps the peak; level k of the 3D map is the peaks with
// LEVEL >= k. CONFIG has one row per level (row k + 1: the ranges and the
// peak count of level k); a peak's retention time is its spectrum's in ms,
// truncated as TopFD writes it; COLOR is computed as TopFD's MsSqlWriter
// computes it. The layout of older versions (ms1_peak without LEVEL, the
// levels as tables PEAKS0 ... PEAKS<n>) is not supported: the upload
// refuses such a file (datasets.checkDataset).
//
// ms1_peak may be stored as BLOB rows (a file compressed by `npm run
// compress`, toppic_test experiment 171, src/server/spectraStore.ts): the
// LEVEL range is then the one zstd_blob_columns records, and the 3D view's
// window decodes the spectra of its RT range.

import { DatabaseSync } from 'node:sqlite';
import { blobTable, BlobTable, decodeBlobRow, spectrumColumns, spectrumRows } from './spectraStore';
import { tableNames } from './sqliteFiles';

/** LEVEL values of ms1_peak (lowest .. highest), cached per handle. */
const levelCache = new WeakMap<DatabaseSync, number[]>();

/** Why a file of an older TopFD or TopDIA version is not read. */
export const OLD_MS1_PEAK_LAYOUT = 'the spectra file was written by an older TopFD or TopDIA version (ms1_peak '
  + 'has no LEVEL column), which TopMSV does not support: deconvolute the spectra again with the current TopFD '
  + 'or TopDIA';

/** Whether ms1_peak (as an unqualified name resolves) has the LEVEL column. */
export function hasMs1Levels(db: DatabaseSync): boolean {
  return spectrumColumns(db, 'ms1_peak').some((c) => c.toUpperCase() === 'LEVEL');
}

/** The LEVEL values of ms1_peak; throws for a file without them (an older TopFD). */
export function ms1Levels(db: DatabaseSync): number[] {
  let levels = levelCache.get(db);
  if (levels !== undefined) return levels;
  if (!hasMs1Levels(db)) throw new Error(OLD_MS1_PEAK_LAYOUT);
  const bt = blobTable(db, 'ms1_peak');
  let lo: number;
  let hi: number;
  if (bt) {
    const level = bt.columns.find((c) => c.name.toUpperCase() === 'LEVEL')!;
    lo = level.min ?? 0;
    hi = level.max ?? 0;
  } else {
    // both ends of the primary key's first column: two index lookups
    const r = db.prepare('SELECT MIN(LEVEL) AS lo, MAX(LEVEL) AS hi FROM ms1_peak').get() as
      { lo: number | null, hi: number | null };
    lo = r.lo ?? 0;
    hi = r.hi ?? 0;
  }
  levels = Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);
  levelCache.set(db, levels);
  return levels;
}

/**
 * One MS1 spectrum's peaks (m/z, intensity) in peak_id order, as rows or as
 * BLOB rows. A spectrum's peaks lie in one key range per level, so the
 * query names every level and sorts them back by peak_id.
 */
export function ms1PeakRows(db: DatabaseSync, specId: number): { mz: number; intensity: number }[] {
  const sql = `SELECT mz, intensity FROM ms1_peak WHERE LEVEL IN (${ms1Levels(db).join(', ')}) AND spec_id = ? `
    + 'ORDER BY peak_id';
  return spectrumRows(db, 'ms1_peak', specId, sql, { columns: ['mz', 'intensity'], orderBy: ['peak_id'] }) as
    { mz: number; intensity: number }[];
}

/**
 * Whether the sqlite holds the MS1 3D view's data: CONFIG with one row per
 * level and no peak above the last level. Throws when CONFIG lists fewer
 * levels than ms1_peak has, i.e. the file is truncated or inconsistent.
 */
export function dbHas3d(db: DatabaseSync): boolean {
  const tables = new Set([...tableNames(db)].map((name) => name.toUpperCase()));
  if (!tables.has('CONFIG')) return false;
  const levels = (db.prepare('SELECT COUNT(*) AS n FROM CONFIG').get() as { n: number }).n;
  const all = ms1Levels(db);
  const top = all.length ? all[all.length - 1] : -1;
  if (levels > 0 && top >= levels) {
    throw new Error(`the sqlite file lists ${levels} MS1 3D levels in CONFIG but ms1_peak has LEVEL ${top}`);
  }
  return levels > 0;
}

// SQLite's SUM() over REAL values: Kahan-Babuska-Neumaier summation (func.c,
// SQLite >= 3.43), so that the sum over BLOB rows is the one SQL returns
class KbnSum {
  private sum = 0;
  private err = 0;
  add(r: number): void {
    const t = this.sum + r;
    if (Math.abs(this.sum) > Math.abs(r)) this.err += (this.sum - t) + r;
    else this.err += (r - t) + this.sum;
    this.sum = t;
  }
  value(): number {
    return Number.isFinite(this.err) ? this.sum + this.err : this.sum;
  }
}

/**
 * Sum of the intensities of the full-resolution level. From BLOB rows the
 * peaks are summed in spectrum and peak order, SQL reads them in key order
 * (LEVEL, spec_id, peak_id); the compensated sum makes the order matter
 * little (the same sum for st_1 and 480_F3_02, toppic_test experiment 171).
 */
export function totalIntensity3d(db: DatabaseSync): number {
  ms1Levels(db);
  const bt = blobTable(db, 'ms1_peak');
  if (bt) {
    const sum = new KbnSum();
    for (const row of bt.conn.prepare(`SELECT * FROM ${bt.from} ORDER BY spec_id`).iterate()) {
      const dec = decodeBlobRow(bt, row as Record<string, unknown>);
      const lv = dec.values.get('LEVEL')!;
      const inte = dec.values.get('intensity')!;
      for (let i = 0; i < dec.n; i++) if (lv[i] >= 0) sum.add(inte[i]);
    }
    return sum.value();
  }
  return (db.prepare('SELECT SUM(intensity) AS s FROM ms1_peak WHERE LEVEL >= 0').get() as
    { s: number | null }).s ?? 0;
}

/** One peak of the 3D view; rt in ms. */
export interface Peak3d { mz: number; intensity: number; rt: number; color: number }

export interface Window3d {
  level: number;
  minRtMs: number; maxRtMs: number;
  minMz: number; maxMz: number;
  cutoff: number;             // intensity > cutoff
  maxPeaks: number;
}

// the MS1 spectra's ids and retention times in ms (id order),
// whether the times never decrease with the id, and the color scale
interface MergedCache {
  ids: number[];
  rts: number[];
  rtSorted: boolean;
  logMin: number;             // NaN: every color 0 (TopFD's degenerate range)
  logSpan: number;
}
const mergedCache = new WeakMap<DatabaseSync, MergedCache>();
const COLOR_NUM = 7;          // MsSqlWriter::COLOR_NUM

function mergedCacheOf(db: DatabaseSync): MergedCache {
  let c = mergedCache.get(db);
  if (c) return c;
  // CAST(... AS INTEGER) truncates, as TopFD's static_cast<int>(rt * 1000)
  const rows = db.prepare(
    'SELECT id, CAST(retention_time * 1000 AS INTEGER) AS rt FROM ms1_spectrum ORDER BY id',
  ).all() as { id: number, rt: number }[];
  const rts = rows.map((r) => r.rt);
  const cfg = db.prepare('SELECT INTMIN AS lo, INTMAX AS hi FROM CONFIG ORDER BY rowid LIMIT 1').get() as
    { lo: number, hi: number } | undefined;
  const degenerate = !cfg || cfg.lo <= 0 || cfg.hi <= cfg.lo;
  c = {
    ids: rows.map((r) => r.id),
    rts,
    rtSorted: rts.every((v, i) => i === 0 || v >= rts[i - 1]),
    logMin: degenerate ? NaN : Math.log(cfg!.lo),
    logSpan: degenerate ? NaN : Math.log(cfg!.hi) - Math.log(cfg!.lo),
  };
  mergedCache.set(db, c);
  return c;
}

// MsSqlWriter's setColors: log-scale bucket between CONFIG's first INTMIN
// and INTMAX
function colorOf(c: MergedCache, intensity: number): number {
  if (Number.isNaN(c.logMin)) return 0;
  const idx = Math.trunc((COLOR_NUM * (Math.log(intensity) - c.logMin)) / c.logSpan);
  return Math.min(COLOR_NUM - 1, Math.max(0, idx));
}

// first index i of the sorted array a with a[i] >= x
function lowerBound(a: number[], x: number): number {
  let lo = 0;
  let hi = a.length;
  while (lo < hi) {
    const m = (lo + hi) >> 1;
    if (a[m] >= x) hi = m; else lo = m + 1;
  }
  return lo;
}

/** The maxPeaks most intense peaks of one level inside an m/z x RT window. */
export function peaks3d(db: DatabaseSync, w: Window3d): Peak3d[] {
  const c = mergedCacheOf(db);
  const levels = ms1Levels(db).filter((l) => l >= w.level).join(', ');
  if (!levels) return [];
  // the spectra inside the RT range: one spec_id range when the retention
  // times follow the ids (TopFD numbers MS1 spectra in scan order), else a list
  let specSql: string;
  let specArgs: (number | string)[];
  let ids: number[];
  if (c.rtSorted) {
    const first = lowerBound(c.rts, w.minRtMs);
    const last = lowerBound(c.rts, Math.floor(w.maxRtMs) + 1) - 1;
    if (last < first) return [];
    specSql = 'spec_id >= ? AND spec_id <= ?';
    specArgs = [c.ids[first], c.ids[last]];
    ids = c.ids.slice(first, last + 1);
  } else {
    ids = c.ids.filter((_, i) => c.rts[i] >= w.minRtMs && c.rts[i] <= w.maxRtMs);
    if (!ids.length) return [];
    specSql = 'spec_id IN (SELECT value FROM json_each(?))';
    specArgs = [JSON.stringify(ids)];
  }
  const rtOf = new Map<number, number>();
  c.ids.forEach((id, i) => rtOf.set(id, c.rts[i]));
  const bt = blobTable(db, 'ms1_peak');
  if (bt) {
    return blobPeaks3d(bt, ids, w)
      .map((p) => ({ mz: p.mz, intensity: p.intensity, rt: rtOf.get(p.specId)!, color: colorOf(c, p.intensity) }));
  }
  const rows = db.prepare(
    `SELECT spec_id, mz, intensity FROM ms1_peak
     WHERE LEVEL IN (${levels}) AND ${specSql} AND mz >= ? AND mz <= ? AND intensity > ?
     ORDER BY intensity DESC LIMIT ?`,
  ).all(...specArgs, w.minMz, w.maxMz, w.cutoff, w.maxPeaks) as any[];
  return rows.map((r) => ({ mz: r.mz, intensity: r.intensity, rt: rtOf.get(r.spec_id)!, color: colorOf(c, r.intensity) }));
}

/**
 * peaks3d over BLOB rows: the peaks of the spectra ids at or above the
 * level inside the window, the maxPeaks most intense. Equal intensities keep
 * the order SQL scans the merged ms1_peak's key in (LEVEL, spec_id,
 * peak_id), which is the order SQLite returns them in.
 */
function blobPeaks3d(bt: BlobTable, ids: number[], w: Window3d): { specId: number; mz: number; intensity: number }[] {
  const lv: number[] = [];
  const spec: number[] = [];
  const pid: number[] = [];
  const mz: number[] = [];
  const inte: number[] = [];
  for (const id of ids) {
    const row = bt.byId.get(id) as Record<string, unknown> | undefined;
    if (!row) continue;
    const dec = decodeBlobRow(bt, row);
    const l = dec.values.get('LEVEL')!;
    const m = dec.values.get('mz')!;
    const it = dec.values.get('intensity')!;
    const p = dec.values.get('peak_id')!;
    for (let i = 0; i < dec.n; i++) {
      if (l[i] >= w.level && m[i] >= w.minMz && m[i] <= w.maxMz && it[i] > w.cutoff) {
        lv.push(l[i]); spec.push(id); pid.push(p[i]); mz.push(m[i]); inte.push(it[i]);
      }
    }
  }
  const order = Array.from(inte.keys());
  order.sort((a, b) => inte[b] - inte[a] || lv[a] - lv[b] || spec[a] - spec[b] || pid[a] - pid[b]);
  return order.slice(0, w.maxPeaks).map((k) => ({ specId: spec[k], mz: mz[k], intensity: inte[k] }));
}
