// Read-only access to a TopFD sqlite file (or a dataset's TopPIC and TopFD
// files, src/server/sqliteFiles.ts) for the converter and the dynamic
// per-scan spectrum endpoints. TopPIC read the deconvoluted peaks from the
// msalign text file, which stores masses with 6 decimals and intensities with
// 2, so values are rounded accordingly before matching.

import { DatabaseSync } from 'node:sqlite';
import { spectrumRows } from '../spectraStore';
import { DeconvPeak } from './annotate';

export interface Ms2SpectrumRow {
  id: number;
  scan: number;
  retention_time: number;
  target_mz: number;
  begin_mz: number;
  end_mz: number;
  n_ion_type: string | null;
  c_ion_type: string | null;
  peak_num: number;
  ms1_id: number | null;
}

export class MsDataDb {
  private db: DatabaseSync;

  /** A file path, or an open connection (which close() then closes). */
  constructor(source: string | DatabaseSync, readOnly = true) {
    this.db = typeof source === 'string' ? new DatabaseSync(source, { readOnly }) : source;
  }

  close(): void {
    this.db.close();
  }

  /** The underlying handle (the identification tables live in the same file). */
  raw(): DatabaseSync {
    return this.db;
  }

  getMs2Spectrum(specId: number): Ms2SpectrumRow | null {
    const row = this.db.prepare('SELECT * FROM ms2_spectrum WHERE id = ?').get(specId);
    return (row as unknown as Ms2SpectrumRow) ?? null;
  }

  getMs1Scan(ms1Id: number): number | null {
    const row = this.db.prepare('SELECT scan FROM ms1_spectrum WHERE id = ?').get(ms1Id) as
      { scan: number } | undefined;
    return row ? row.scan : null;
  }

  /** Deconvoluted peaks (envelopes) of one MS2 spectrum, in msalign precision. */
  getMs2DeconvPeaks(specId: number): DeconvPeak[] {
    const rows = spectrumRows(this.db, 'ms2_env', specId,
      'SELECT env_id, mono_mass, charge, intensity FROM ms2_env WHERE spec_id = ? ORDER BY env_id',
      { columns: ['env_id', 'mono_mass', 'charge', 'intensity'], orderBy: ['env_id'] },
    ) as unknown as { env_id: number; mono_mass: number; charge: number; intensity: number }[];
    return rows.map((r) => ({
      specId,
      peakId: r.env_id,
      mass: Number(r.mono_mass.toFixed(6)),
      intensity: Number(r.intensity.toFixed(2)),
      charge: r.charge,
    }));
  }
}
