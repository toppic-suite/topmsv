/**
 * Frontend data API for the per-dataset raw-spectra browser.
 *
 * Defines `window.electronAPI` (the name kept for historical reasons from the
 * original TopMSV viewer) on top of `fetch()`. The page is served under
 * /d/<dataset>/spectra.html, so all endpoints are dataset-relative ("api/...")
 * and the sqlite file is opened server-side automatically — openMsFile just
 * reports the dataset name.
 */
const getJson = async (url) => {
  const res = await fetch(url)
  return res.json()
}

window.electronAPI = {
  openMsFile: async () => {
    const meta = await getJson('api/meta')
    return meta && meta.name ? meta.name : ''
  },
  getMsOneScanNum: () => getJson('api/scan-num'),
  getMsOneInfoById: (ms_one_id) => getJson('api/info/' + ms_one_id),
  getMsOnePeakListById: (ms_one_id) => getJson('api/peaks/' + ms_one_id),
  getMsOneEnvListById: (ms_one_id) => getJson('api/envs/' + ms_one_id),
  getMsOneEnvPeakListById: (ms_one_id) => getJson('api/env-peaks/' + ms_one_id),
  getMsOneIdByScan: (ms_one_scan) => getJson('api/id-by-scan/' + ms_one_scan),
  getMsTwoScanNum: () => getJson('api/ms2-scan-num'),
  getMsTwoInfoById: (ms_two_id) => getJson('api/ms2-info/' + ms_two_id),
  getMsTwoPeakListById: (ms_two_id) => getJson('api/ms2-peaks/' + ms_two_id),
  getMsTwoEnvListById: (ms_two_id) => getJson('api/ms2-envs/' + ms_two_id),
  getMsTwoEnvPeakListById: (ms_two_id) => getJson('api/ms2-env-peaks/' + ms_two_id),
  getMsTwoIdByScan: (ms_two_scan) => getJson('api/ms2-id-by-scan/' + ms_two_scan),
  getMsTwoIdByMsOneId: (ms_one_id) => getJson('api/ms2-id-by-ms1/' + ms_one_id)
}
