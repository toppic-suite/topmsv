// Dynamic generation of the per-scan spectrum files that the TopMSV viewer
// loads from ../../topfd/ms1_json/spectrum<id>.js and ms2_json/spectrum<id>.js.
// Format follows toppic-suite src/ms/mzml/mzml_ms_json_writer.cpp, backed by
// the TopFD sqlite tables instead of pre-generated files.

import { DatabaseSync } from 'node:sqlite';
import { fixedToString, toScientificStr } from './convert/format';

interface JsonPeak { mz: string; intensity: string }
interface JsonEnvPeak { mz: number; intensity: number }
interface JsonEnvelope {
  id: number; mono_mass: number; charge: number;
  ref_mass?: number;   // reference (most abundant) isotope mass; newer TopFD only
  env_peaks: JsonEnvPeak[];
}

// Whether <prefix>_env has the ref_mass column (added by newer TopFD versions).
function hasRefMass(db: DatabaseSync, prefix: string): boolean {
  const cols = db.prepare(`PRAGMA table_info(${prefix}_env)`).all() as { name: string }[];
  return cols.some((c) => c.name === 'ref_mass');
}

export function buildSpectrumJs(db: DatabaseSync, level: 1 | 2, specId: number): string | null {
  const prefix = level === 1 ? 'ms1' : 'ms2';
  const spec = db.prepare(`SELECT * FROM ${prefix}_spectrum WHERE id = ?`).get(specId) as any;
  if (!spec) return null;

  const doc: { [k: string]: unknown } = {
    id: spec.id,
    scan: spec.scan,
    retention_time: spec.retention_time,
    target_mz: level === 2 ? spec.target_mz : -1.0,
    min_mz: level === 2 ? spec.begin_mz : -1.0,
    max_mz: level === 2 ? spec.end_mz : -1.0,
  };
  if (level === 2) {
    doc.n_ion_type = spec.n_ion_type ?? 'B';
    doc.c_ion_type = spec.c_ion_type ?? 'Y';
  }

  const peakRows = db.prepare(
    `SELECT mz, intensity FROM ${prefix}_peak WHERE spec_id = ? ORDER BY peak_id`,
  ).all(specId) as any[];
  doc.peaks = peakRows.map((r): JsonPeak => ({
    mz: fixedToString(r.mz, 4),
    intensity: toScientificStr(r.intensity, 4),
  }));

  const withRefMass = hasRefMass(db, prefix);
  const envRows = db.prepare(
    `SELECT env_id, mono_mass, charge${withRefMass ? ', ref_mass' : ''} FROM ${prefix}_env ` +
    'WHERE spec_id = ? ORDER BY env_id',
  ).all(specId) as any[];
  const envPeakRows = db.prepare(
    `SELECT env_id, mz, intensity FROM ${prefix}_env_peak WHERE spec_id = ? ORDER BY env_id, peak_id`,
  ).all(specId) as any[];
  const peaksByEnv = new Map<number, JsonEnvPeak[]>();
  for (const r of envPeakRows) {
    let list = peaksByEnv.get(r.env_id);
    if (!list) { list = []; peaksByEnv.set(r.env_id, list); }
    list.push({ mz: r.mz, intensity: r.intensity });
  }
  doc.envelopes = envRows.map((r, i): JsonEnvelope => {
    const env: JsonEnvelope = { id: i, mono_mass: r.mono_mass, charge: r.charge, env_peaks: [] };
    if (withRefMass && r.ref_mass != null) env.ref_mass = r.ref_mass;
    env.env_peaks = peaksByEnv.get(r.env_id) ?? [];
    return env;
  });

  const globalName = level === 1 ? 'ms1_data' : 'ms2_data';
  return `${globalName} =\n` + JSON.stringify(doc, null, 4);
}
