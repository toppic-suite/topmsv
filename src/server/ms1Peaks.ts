// The MS1 peaks of a TopFD sqlite in either of its two layouts, and the MS1
// 3D view's data over them.
//
// Old layout (TopFD up to 2.1.0): ms1_peak(spec_id, peak_id, mz, intensity)
// without an index (ensureIndexes adds one on spec_id); with topfd -D also
// the 3D levels as tables PEAKS0 ... PEAKS<n> (MZ, INTENSITY, RETENTIONTIME
// in ms, COLOR), each indexed on (RETENTIONTIME, MZ), and CONFIG.
//
// Merged layout (toppic_test experiment 165): one table
//   ms1_peak(LEVEL, spec_id, peak_id, mz, intensity) WITHOUT ROWID,
//   PRIMARY KEY(LEVEL, spec_id, peak_id)
// LEVEL is -1 for a peak outside the 3D map (intensity <= 0), else the
// highest level that keeps the peak (0 without -D); level k of the 3D map is
// the peaks with LEVEL >= k. CONFIG is as before (row k + 1: the ranges and
// the peak count of level k); a peak's retention time is its spectrum's in
// ms, truncated as TopFD writes it; COLOR is computed as TopFD's
// MsSqlWriter computes it. The layouts are told apart by the LEVEL column.

import { DatabaseSync } from 'node:sqlite';
import { tableNames } from './sqliteFiles';

/** LEVEL values of a merged ms1_peak (lowest .. highest), cached per handle. */
const mergedLevels = new WeakMap<DatabaseSync, number[] | null>();

/** The LEVEL values of a merged ms1_peak, or null for the old layout. */
export function mergedMs1Levels(db: DatabaseSync): number[] | null {
  let levels = mergedLevels.get(db);
  if (levels !== undefined) return levels;
  const cols = db.prepare('PRAGMA table_info(ms1_peak)').all() as { name: string }[];
  if (!cols.some((c) => c.name.toUpperCase() === 'LEVEL')) {
    levels = null;
  } else {
    // both ends of the primary key's first column: two index lookups
    const r = db.prepare('SELECT MIN(LEVEL) AS lo, MAX(LEVEL) AS hi FROM ms1_peak').get() as
      { lo: number | null, hi: number | null };
    const lo = r.lo ?? 0;
    const hi = r.hi ?? 0;
    levels = Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);
  }
  mergedLevels.set(db, levels);
  return levels;
}

/** Whether the file at sqlitePath has a merged ms1_peak. */
export function isMergedMs1(sqlitePath: string): boolean {
  const db = new DatabaseSync(sqlitePath, { readOnly: true });
  try {
    const cols = db.prepare('PRAGMA table_info(ms1_peak)').all() as { name: string }[];
    return cols.some((c) => c.name.toUpperCase() === 'LEVEL');
  } finally {
    db.close();
  }
}

/**
 * The SQL of one MS1 spectrum's peaks (m/z, intensity), its spec_id the only
 * parameter. In the merged layout a spectrum's peaks lie in one key range per
 * level, so the query names every level and sorts them back by peak_id.
 * orderByPeakId: the old layout's query sorts as well (otherwise its rows
 * come in insertion order, which is peak_id order).
 */
export function ms1PeakSql(db: DatabaseSync, orderByPeakId: boolean): string {
  const levels = mergedMs1Levels(db);
  if (levels === null) {
    return 'SELECT mz, intensity FROM ms1_peak WHERE spec_id = ?' + (orderByPeakId ? ' ORDER BY peak_id' : '');
  }
  return `SELECT mz, intensity FROM ms1_peak WHERE LEVEL IN (${levels.join(', ')}) AND spec_id = ? ORDER BY peak_id`;
}

/**
 * Whether the sqlite holds the MS1 3D view's data: CONFIG with one row per
 * level and, in the old layout, PEAKS0 ... PEAKS<n>; in the merged layout no
 * peak above the last level. Throws when CONFIG lists more levels than the
 * file holds, i.e. the file is truncated or inconsistent.
 */
export function dbHas3d(db: DatabaseSync): boolean {
  const tables = new Set([...tableNames(db)].map((name) => name.toUpperCase()));
  if (!tables.has('CONFIG')) return false;
  const levels = (db.prepare('SELECT COUNT(*) AS n FROM CONFIG').get() as { n: number }).n;
  const merged = mergedMs1Levels(db);
  if (merged !== null) {
    const top = merged.length ? merged[merged.length - 1] : -1;
    if (levels > 0 && top >= levels) {
      throw new Error(`the sqlite file lists ${levels} MS1 3D levels in CONFIG but ms1_peak has LEVEL ${top}`);
    }
    return levels > 0;
  }
  if (!tables.has('PEAKS0')) return false;
  for (let i = 0; i < levels; i++) {
    if (!tables.has('PEAKS' + i)) {
      throw new Error(`the sqlite file lists ${levels} MS1 3D levels in CONFIG but has no PEAKS${i} table`);
    }
  }
  return levels > 0;
}

/** Sum of the intensities of the full-resolution level. */
export function totalIntensity3d(db: DatabaseSync): number {
  const sql = mergedMs1Levels(db) === null
    ? 'SELECT SUM(INTENSITY) AS s FROM PEAKS0'
    : 'SELECT SUM(intensity) AS s FROM ms1_peak WHERE LEVEL >= 0';
  return (db.prepare(sql).get() as { s: number | null }).s ?? 0;
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

// merged layout: the MS1 spectra's ids and retention times in ms (id order),
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
  const merged = mergedMs1Levels(db);
  if (merged === null) {
    const rows = db.prepare(
      `SELECT MZ, INTENSITY, RETENTIONTIME, COLOR FROM PEAKS${w.level}
       WHERE RETENTIONTIME >= ? AND RETENTIONTIME <= ? AND MZ >= ? AND MZ <= ? AND INTENSITY > ?
       ORDER BY INTENSITY DESC LIMIT ?`,
    ).all(w.minRtMs, w.maxRtMs, w.minMz, w.maxMz, w.cutoff, w.maxPeaks) as any[];
    return rows.map((r) => ({ mz: r.MZ, intensity: r.INTENSITY, rt: r.RETENTIONTIME, color: r.COLOR }));
  }
  const c = mergedCacheOf(db);
  const levels = merged.filter((l) => l >= w.level).join(', ');
  if (!levels) return [];
  // the spectra inside the RT range: one spec_id range when the retention
  // times follow the ids (TopFD numbers MS1 spectra in scan order), else a list
  let specSql: string;
  let specArgs: (number | string)[];
  if (c.rtSorted) {
    const first = lowerBound(c.rts, w.minRtMs);
    const last = lowerBound(c.rts, Math.floor(w.maxRtMs) + 1) - 1;
    if (last < first) return [];
    specSql = 'spec_id >= ? AND spec_id <= ?';
    specArgs = [c.ids[first], c.ids[last]];
  } else {
    const ids = c.ids.filter((_, i) => c.rts[i] >= w.minRtMs && c.rts[i] <= w.maxRtMs);
    if (!ids.length) return [];
    specSql = 'spec_id IN (SELECT value FROM json_each(?))';
    specArgs = [JSON.stringify(ids)];
  }
  const rtOf = new Map<number, number>();
  c.ids.forEach((id, i) => rtOf.set(id, c.rts[i]));
  const rows = db.prepare(
    `SELECT spec_id, mz, intensity FROM ms1_peak
     WHERE LEVEL IN (${levels}) AND ${specSql} AND mz >= ? AND mz <= ? AND intensity > ?
     ORDER BY intensity DESC LIMIT ?`,
  ).all(...specArgs, w.minMz, w.maxMz, w.cutoff, w.maxPeaks) as any[];
  return rows.map((r) => ({ mz: r.mz, intensity: r.intensity, rt: rtOf.get(r.spec_id)!, color: colorOf(c, r.intensity) }));
}
