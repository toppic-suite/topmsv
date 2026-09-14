/**
 * Frontend data API for the per-dataset raw-spectra browser.
 *
 * Defines `window.electronAPI` (the name kept for historical reasons from the
 * original TopMSV viewer) on top of `fetch()`. The page is served under
 * /d/<dataset>/spectra/spectra.html, so all endpoints are dataset-relative ("../api/...")
 * and the sqlite file is opened server-side automatically — openMsFile just
 * reports the dataset name. The row types mirror the sqlite tables the
 * server returns verbatim (src/server/routes/dataset.ts).
 */

/** ms1_spectrum / ms2_spectrum row */
interface SpectrumInfoRow {
  id: number;
  scan: number;
  retention_time: number;
  peak_num: number;
  // MS1 only
  env_num?: number;
  base_inte?: number;
  min_ref_inte?: number;
  // MS2 only
  target_mz?: number | null;
  begin_mz?: number;
  end_mz?: number;
  n_ion_type?: string;
  c_ion_type?: string;
  ms1_id?: number | null;   // absent in files predating ms1_id linking
}

/** ms1_peak / ms2_peak row */
interface PeakRow {
  mz: number;
  intensity: number;
}

/** ms1_env / ms2_env row */
interface EnvRow {
  spec_id: number;
  env_id: number;
  mono_mass: number;
  charge: number;
  intensity: number;
  envcnn_score: number;
  peak_num: number;
  ref_mass?: number | null;   // newer TopFD only
}

/** ms1_env_peak / ms2_env_peak row */
interface EnvPeakRow {
  spec_id: number;
  env_id: number;
  peak_id: number;
  mz: number;
  intensity: number;
}

interface IdRow {
  id: number;
}

interface ElectronApi {
  /** name of the dataset ("" if unknown) */
  openMsFile(): Promise<string>;
  getMsOneScanNum(): Promise<number>;
  getMsOneInfoById(msOneId: number): Promise<SpectrumInfoRow | null>;
  getMsOnePeakListById(msOneId: number): Promise<PeakRow[]>;
  getMsOneEnvListById(msOneId: number): Promise<EnvRow[]>;
  getMsOneEnvPeakListById(msOneId: number): Promise<EnvPeakRow[]>;
  /** first MS1 spectrum with scan >= the given scan */
  getMsOneIdByScan(msOneScan: number): Promise<IdRow | null>;
  getMsTwoScanNum(): Promise<number>;
  getMsTwoInfoById(msTwoId: number): Promise<SpectrumInfoRow | null>;
  getMsTwoPeakListById(msTwoId: number): Promise<PeakRow[]>;
  getMsTwoEnvListById(msTwoId: number): Promise<EnvRow[]>;
  getMsTwoEnvPeakListById(msTwoId: number): Promise<EnvPeakRow[]>;
  getMsTwoIdByScan(msTwoScan: number): Promise<IdRow | null>;
  /**
   * smallest-id MS2 spectrum of an MS1 spectrum: id -1 when it has none,
   * null when the file predates ms1_id linking
   */
  getMsTwoIdByMsOneId(msOneId: number): Promise<IdRow | null>;
}

interface Window {
  electronAPI: ElectronApi;
}

const getJson = async <T>(url: string): Promise<T> => {
  const res = await fetch(url);
  return res.json() as Promise<T>;
};

window.electronAPI = {
  openMsFile: async () => {
    const meta = await getJson<{ name?: string } | null>('../api/meta');
    return meta && meta.name ? meta.name : '';
  },
  getMsOneScanNum: () => getJson('../api/scan-num'),
  getMsOneInfoById: (ms_one_id) => getJson('../api/info/' + ms_one_id),
  getMsOnePeakListById: (ms_one_id) => getJson('../api/peaks/' + ms_one_id),
  getMsOneEnvListById: (ms_one_id) => getJson('../api/envs/' + ms_one_id),
  getMsOneEnvPeakListById: (ms_one_id) => getJson('../api/env-peaks/' + ms_one_id),
  getMsOneIdByScan: (ms_one_scan) => getJson('../api/id-by-scan/' + ms_one_scan),
  getMsTwoScanNum: () => getJson('../api/ms2-scan-num'),
  getMsTwoInfoById: (ms_two_id) => getJson('../api/ms2-info/' + ms_two_id),
  getMsTwoPeakListById: (ms_two_id) => getJson('../api/ms2-peaks/' + ms_two_id),
  getMsTwoEnvListById: (ms_two_id) => getJson('../api/ms2-envs/' + ms_two_id),
  getMsTwoEnvPeakListById: (ms_two_id) => getJson('../api/ms2-env-peaks/' + ms_two_id),
  getMsTwoIdByScan: (ms_two_scan) => getJson('../api/ms2-id-by-scan/' + ms_two_scan),
  getMsTwoIdByMsOneId: (ms_one_id) => getJson('../api/ms2-id-by-ms1/' + ms_one_id),
};
