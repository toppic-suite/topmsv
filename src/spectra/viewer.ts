/**
 * Frontend controller for the spectrum viewer. Loaded via a <script> tag in
 * spectra.html and runs in the browser. It reaches the data through
 * `window.electronAPI`, which is defined by api.ts (backed by the REST
 * endpoints in src/server/routes/dataset.ts).
 */

const ms_one_prev_btn: HTMLElement = document.getElementById('msOnePrevBtn');
const ms_one_next_btn: HTMLElement = document.getElementById('msOneNextBtn');
const ms_one_go_btn: HTMLElement = document.getElementById('msOneGoBtn');
const ms_one_reset_btn: HTMLElement = document.getElementById('msOneResetBtn');
const ms_help_btn: HTMLElement = document.getElementById('msHelpBtn');

let help_win: HTMLElement = document.getElementById('helpPopupWin');
let help_win_close_btn: HTMLElement = document.getElementById('helpPopupWinCloseBtn');
let ms_file_path_text: HTMLElement = document.getElementById('msFilePathText');
let ms_one_total_scan_num_text: HTMLElement = document.getElementById('msOneTotalScanNumText');
let cur_ms_one_order_text: HTMLElement = document.getElementById('curMsOneOrderText');
let cur_ms_one_scan_text: HTMLElement = document.getElementById('curMsOneScanText');
let cur_ms_one_peak_num_text: HTMLElement = document.getElementById('curMsOnePeakNumText');
let cur_ms_one_env_num_text: HTMLElement = document.getElementById('curMsOneEnvNumText');
let cur_ms_one_rt_text: HTMLElement = document.getElementById('curMsOneRTText');

let query_ms_one_scan_input = document.getElementById('queryMsOneScanInput') as HTMLInputElement;

// MS2 panel controls
const ms_two_prev_btn: HTMLElement = document.getElementById('msTwoPrevBtn');
const ms_two_next_btn: HTMLElement = document.getElementById('msTwoNextBtn');
const ms_two_go_btn: HTMLElement = document.getElementById('msTwoGoBtn');
const ms_two_reset_btn: HTMLElement = document.getElementById('msTwoResetBtn');
const ms_two_inspect_btn: HTMLElement = document.getElementById('msTwoInspectBtn');
let ms_two_total_scan_num_text: HTMLElement = document.getElementById('msTwoTotalScanNumText');
let cur_ms_two_order_text: HTMLElement = document.getElementById('curMsTwoOrderText');
let cur_ms_two_scan_text: HTMLElement = document.getElementById('curMsTwoScanText');
let cur_ms_two_peak_num_text: HTMLElement = document.getElementById('curMsTwoPeakNumText');
let cur_ms_two_env_num_text: HTMLElement = document.getElementById('curMsTwoEnvNumText');
let cur_ms_two_prec_mz_text: HTMLElement = document.getElementById('curMsTwoPrecMzText');
let cur_ms_two_rt_text: HTMLElement = document.getElementById('curMsTwoRTText');
let query_ms_two_scan_input = document.getElementById('queryMsTwoScanInput') as HTMLInputElement;

let spec_data: SpectrumData = new SpectrumData();
// assigned inside the async flows below
let ms_one_spec_info: SpectrumInfoRow | null;
let ms_one_scan_num: number;
let cur_ms_one_id: number;
let query_scan: number;
let query_result: IdRow | null;
let query_ms_id: number;
let ms_one_graph: SpectrumView | null = null;
let ms_two_graph: SpectrumView | null = null;
let ms_two_scan_num: number = 0;
// ms1_id of the spectrum currently shown in the MS2 panel (-1 if none/unknown)
let cur_ms_two_ms1_id: number = -1;
// false once the open file turns out to have no ms2_spectrum.ms1_id column
let ms_two_link_active: boolean = true;

// proton mass: mono m/z = mono mass / charge + PROTON_MASS
const PROTON_MASS: number = 1.007276;

/** the "envelopeclick" CustomEvent the spectrum graph dispatches (see draw_spectrum.ts) */
type EnvelopeClickEvent = CustomEvent<{ envelope: Envelope; peak: Peak }>;

// The MS1 / MS2 panels of this page show hover info in the panel header
// (annoElementId) and draw every envelope in the window (no thinning);
// the shared SpectrumView defaults to the TopMSV viewer's floating
// tooltips and thinned envelopes.
function configurePanelView(view: SpectrumView, annoElementId: string): void {
  view.getPara().setAnnoElementId(annoElementId);
  view.getPara().setThinEnvelopes(false);
}

// Show an empty spectrum in the MS2 panel (empty axes, cleared header/table).
function clearMsTwoPanel(): void {
  spec_data.setCurMsTwoId(-1);
  cur_ms_two_ms1_id = -1;
  cur_ms_two_order_text.textContent = "";
  cur_ms_two_scan_text.textContent = "";
  cur_ms_two_peak_num_text.textContent = "";
  cur_ms_two_env_num_text.textContent = "";
  cur_ms_two_prec_mz_text.textContent = "";
  cur_ms_two_rt_text.textContent = "";
  query_ms_two_scan_input.value = "";
  mass2_table.clear().draw();
  let ms2_view: SpectrumView = new SpectrumView("ms2_svg_graph", []);
  configurePanelView(ms2_view, "curMsTwoAnnoText");
  ms2_view.addRawSpectrumAnno([], []);
  ms_two_graph = $("#ms2_svg_graph").data("graph") as SpectrumView;
  ms_two_graph.redraw();
}

// Keep the MS2 panel linked to the MS1 panel: when a new MS1 spectrum is
// shown and the current MS2 spectrum is not one of its fragmentation scans
// (ms2_spectrum.ms1_id), load the smallest-id MS2 spectrum linked to it, or
// an empty spectrum if the MS1 spectrum has no linked MS2.
async function syncMsTwoToMsOne(ms_one_id: number): Promise<void> {
  if (!ms_two_link_active) return;
  if (spec_data.getCurMsTwoId() >= 0 && cur_ms_two_ms1_id === ms_one_id) return;
  let r: IdRow | null = await window.electronAPI.getMsTwoIdByMsOneId(ms_one_id);
  if (r == null) {
    // this data file has no ms1_id column: leave the MS2 panel independent
    ms_two_link_active = false;
    return;
  }
  if (r.id >= 0 && r.id < spec_data.getMsTwoScanNum()) {
    spec_data.setCurMsTwoId(r.id);
    await updateMsTwoById(r.id);
  } else {
    clearMsTwoPanel();
  }
}

// The reverse link: when a new MS2 spectrum is shown and the MS1 panel is not
// showing its precursor spectrum (ms2_spectrum.ms1_id), load that MS1
// spectrum. The two syncs cannot recurse: each returns when the panels are
// already linked, which is the state the other sync establishes.
async function syncMsOneToMsTwo(): Promise<void> {
  if (cur_ms_two_ms1_id < 0) return; // no link info (old file format)
  if (spec_data.getCurMsOneId() === cur_ms_two_ms1_id) return;
  if (cur_ms_two_ms1_id < spec_data.getMsOneScanNum()) {
    spec_data.setCurMsOneId(cur_ms_two_ms1_id);
    await updateMsOneById(cur_ms_two_ms1_id);
  }
}

// Envelope model objects of one spectrum's ms{1,2}_env rows, and their rows
// in the panel's mass list: ID (1-based, TopFD env_id + 1, like the PrSM peak
// table), mono mass, mono m/z, ref m/z (NaN, shown blank, if the file has no
// ref_mass column), charge, intensity, score.
function fillEnvelopes(db_env_list: EnvRow[], table: MassTable): Envelope[] {
  let env_obj_list: Envelope[] = [];
  table.clear();
  for (let i = 0; i < db_env_list.length; i++) {
    let env: EnvRow = db_env_list[i];
    let env_obj: Envelope = new Envelope(env.mono_mass, env.charge, env.intensity);
    env_obj.setId(env.env_id);
    env_obj_list.push(env_obj);
    let refMz: number = (env.ref_mass != null) ? env.ref_mass / env.charge + PROTON_MASS : NaN;
    table.row.add([env.env_id + 1,
      env.mono_mass,
      env.mono_mass / env.charge + PROTON_MASS,
      refMz,
      env.charge,
      env.intensity,
      env.envcnn_score]);
  }
  // draw outside the loop: with zero envelopes the table must still repaint
  // (clear() alone leaves the previous spectrum's rows on screen)
  table.draw();
  return env_obj_list;
}

function peakObjects(db_peak_list: PeakRow[]): Peak[] {
  let peak_obj_list: Peak[] = [];
  for (let i = 0; i < db_peak_list.length; i++) {
    peak_obj_list.push(new Peak(i.toString(), db_peak_list[i].mz, db_peak_list[i].mz, db_peak_list[i].intensity));
  }
  return peak_obj_list;
}

function addEnvelopePeaks(db_env_peak_list: EnvPeakRow[], env_obj_list: Envelope[]): void {
  for (let i = 0; i < db_env_peak_list.length; i++) {
    let env_peak: EnvPeakRow = db_env_peak_list[i];
    let peak: Peak = new Peak(env_peak.peak_id.toString(), env_peak.mz, env_peak.mz, env_peak.intensity);
    env_obj_list[env_peak.env_id].addPeaks(peak);
  }
}

async function updateMsOneById(cur_ms_one_id: number): Promise<void> {
  if (cur_ms_one_id >= 0 && cur_ms_one_id < spec_data.getMsOneScanNum()) {
    cur_ms_one_order_text.textContent = (cur_ms_one_id + 1).toString() + "/" + ms_one_scan_num.toString();
    ms_one_spec_info = await window.electronAPI.getMsOneInfoById(cur_ms_one_id);
    cur_ms_one_scan_text.textContent = String(ms_one_spec_info.scan);
    query_ms_one_scan_input.value = "";
    cur_ms_one_peak_num_text.textContent = String(ms_one_spec_info.peak_num);
    cur_ms_one_rt_text.textContent = (ms_one_spec_info.retention_time / 60).toFixed(3) + " min";
    let db_peak_list: PeakRow[] = await window.electronAPI.getMsOnePeakListById(cur_ms_one_id);
    let peak_obj_list: Peak[] = peakObjects(db_peak_list);

    let db_env_list: EnvRow[] = await window.electronAPI.getMsOneEnvListById(cur_ms_one_id);
    let env_obj_list: Envelope[] = fillEnvelopes(db_env_list, mass_table);
    cur_ms_one_env_num_text.textContent = String(env_obj_list.length);
    let db_env_peak_list: EnvPeakRow[] = await window.electronAPI.getMsOneEnvPeakListById(cur_ms_one_id);
    addEnvelopePeaks(db_env_peak_list, env_obj_list);

    // Separate SpectrumFunction instances: the interval state left by
    // assignLevelPeaks holds peak-list indices, which assignLevelEnvs would
    // otherwise dereference against the (shorter) envelope list.
    new SpectrumFunction().assignLevelPeaks(peak_obj_list);
    new SpectrumFunction().assignLevelEnvs(env_obj_list);
    let ms1_view: SpectrumView = new SpectrumView("ms1_svg_graph", peak_obj_list);
    configurePanelView(ms1_view, "curMsOneAnnoText");
    ms1_view.addRawSpectrumAnno(env_obj_list, []);
    ms1_view.addBaseInte(ms_one_spec_info.base_inte, ms_one_spec_info.min_ref_inte);
    ms_one_graph = $("#" + ms1_view.getSvgId()).data("graph") as SpectrumView;
    ms_one_graph.redraw();
    $("#mass1Table .row_ref_mz").on('click', function (e) {
      // center the graph on the clicked ref m/z value
      let monoMz: number = parseFloat(e.currentTarget.innerHTML);
      ms_one_graph.getPara().updateMzRange(monoMz);
      ms_one_graph.redraw();
    });
    // keep the MS2 panel on a fragmentation scan of this MS1 spectrum
    await syncMsTwoToMsOne(cur_ms_one_id);
  }
}

// The dataset is fixed by the URL (/d/<dataset>/spectra/spectra.html), so the data
// file is loaded automatically when the page opens.
(async () => {
  ms_file_path_text.textContent = await window.electronAPI.openMsFile();
  //Get Ms One scan num
  ms_one_scan_num = await window.electronAPI.getMsOneScanNum();
  spec_data.setMsOneScanNum(ms_one_scan_num);
  ms_one_total_scan_num_text.textContent = String(ms_one_scan_num);
  //Se current MS one ID
  if (ms_one_scan_num > 0) {
    spec_data.setCurMsOneId(0);
  }
  else {
    spec_data.setCurMsOneId(-1);
    cur_ms_one_order_text.textContent = "";
    cur_ms_one_scan_text.textContent = "";
    cur_ms_one_peak_num_text.textContent = "";
    cur_ms_one_rt_text.textContent = "";
  }
  // ---- MS2 ----
  // Fetch the MS2 scan count and reset the link state before loading the MS1
  // spectrum: updateMsOneById links/loads the MS2 panel via syncMsTwoToMsOne.
  ms_two_scan_num = await window.electronAPI.getMsTwoScanNum();
  spec_data.setMsTwoScanNum(ms_two_scan_num);
  ms_two_total_scan_num_text.textContent = String(ms_two_scan_num);
  spec_data.setCurMsTwoId(-1);
  cur_ms_two_ms1_id = -1;
  ms_two_link_active = true;

  cur_ms_one_id = spec_data.getCurMsOneId();
  await updateMsOneById(cur_ms_one_id);

  // Fallbacks: an MS2-only file, or a file without the ms1_id link column —
  // show the first MS2 spectrum; with no MS2 spectra, show an empty one.
  if (spec_data.getCurMsTwoId() < 0) {
    if (ms_two_scan_num > 0 && (ms_one_scan_num === 0 || !ms_two_link_active)) {
      spec_data.setCurMsTwoId(0);
      updateMsTwoById(0);
    } else if (ms_two_scan_num === 0) {
      clearMsTwoPanel();
    }
  }
})();

ms_one_next_btn.addEventListener('click', async () => {
  cur_ms_one_id = spec_data.getCurMsOneId();
  if (cur_ms_one_id >= 0 && cur_ms_one_id < (spec_data.getMsOneScanNum() - 1)) {
    cur_ms_one_id++;
    spec_data.setCurMsOneId(cur_ms_one_id);
    updateMsOneById(cur_ms_one_id);
  }
});

ms_one_prev_btn.addEventListener('click', async () => {
  cur_ms_one_id = spec_data.getCurMsOneId();
  if (cur_ms_one_id >= 1 && cur_ms_one_id < spec_data.getMsOneScanNum()) {
    cur_ms_one_id--;
    spec_data.setCurMsOneId(cur_ms_one_id);
    updateMsOneById(cur_ms_one_id);
  }
});

async function queryMsOneScan(): Promise<void> {
  query_scan = parseInt(query_ms_one_scan_input.value);
  if (isNaN(query_scan)) {
    alert("Please input a valid scan number");
    return;
  }
  query_result = await window.electronAPI.getMsOneIdByScan(query_scan);
  if (query_result == null) {
    alert("Scan number not found");
    return;
  }
  query_ms_id = query_result.id;
  if (query_ms_id >= 0 && query_ms_id < spec_data.getMsOneScanNum()) {
    spec_data.setCurMsOneId(query_ms_id);
    updateMsOneById(query_ms_id);
  }
  else {
    alert("Scan number not found");
  }
}

ms_one_go_btn.addEventListener('click', async () => {
  queryMsOneScan();
});

query_ms_one_scan_input.addEventListener("keydown", function (event: KeyboardEvent) {
  if (event.key === "Enter") {
    queryMsOneScan();
  }
});

ms_help_btn.addEventListener('click', () => {
  help_win.classList.add('open');
});

help_win_close_btn.addEventListener('click', () => {
  help_win.classList.remove('open');
});

// close when clicking the backdrop outside the dialog
help_win.addEventListener('click', (e: MouseEvent) => {
  if (e.target === help_win) help_win.classList.remove('open');
});

ms_one_reset_btn.addEventListener('click', async () => {
  if (ms_one_graph != null) {
    ms_one_graph.getPara().resetScale();
    ms_one_graph.redraw();
  }
});

// ===== MS2 spectrum panel =====
// Reuses the MS1 SpectrumView visualization for the MS2 spectrum: the raw peak
// list plus the deconvoluted envelopes/peaks (ms2_env, ms2_env_peak), drawn the
// same way the MS1 panel draws ms1_env / ms1_env_peak.
async function updateMsTwoById(cur_ms_two_id: number): Promise<void> {
  if (cur_ms_two_id >= 0 && cur_ms_two_id < spec_data.getMsTwoScanNum()) {
    cur_ms_two_order_text.textContent = (cur_ms_two_id + 1).toString() + "/" + ms_two_scan_num.toString();
    let info: SpectrumInfoRow | null = await window.electronAPI.getMsTwoInfoById(cur_ms_two_id);
    cur_ms_two_ms1_id = (info.ms1_id != null) ? info.ms1_id : -1;
    cur_ms_two_scan_text.textContent = String(info.scan);
    query_ms_two_scan_input.value = "";
    cur_ms_two_peak_num_text.textContent = String(info.peak_num);
    cur_ms_two_prec_mz_text.textContent =
      (info.target_mz != null) ? info.target_mz.toFixed(3) : "";
    cur_ms_two_rt_text.textContent =
      (info.retention_time != null) ? (info.retention_time / 60).toFixed(3) + " min" : "";

    let db_peak_list: PeakRow[] = await window.electronAPI.getMsTwoPeakListById(cur_ms_two_id);
    let peak_obj_list: Peak[] = peakObjects(db_peak_list);

    // Deconvoluted envelopes and their peaks (same layout as the MS1 panel).
    let db_env_list: EnvRow[] = await window.electronAPI.getMsTwoEnvListById(cur_ms_two_id);
    let env_obj_list: Envelope[] = fillEnvelopes(db_env_list, mass2_table);
    if (cur_ms_two_env_num_text) cur_ms_two_env_num_text.textContent = String(env_obj_list.length);
    let db_env_peak_list: EnvPeakRow[] = await window.electronAPI.getMsTwoEnvPeakListById(cur_ms_two_id);
    addEnvelopePeaks(db_env_peak_list, env_obj_list);

    // Separate instances, same reason as in updateMsOneById.
    new SpectrumFunction().assignLevelPeaks(peak_obj_list);
    new SpectrumFunction().assignLevelEnvs(env_obj_list);
    let ms2_view: SpectrumView = new SpectrumView("ms2_svg_graph", peak_obj_list);
    configurePanelView(ms2_view, "curMsTwoAnnoText");
    ms2_view.addRawSpectrumAnno(env_obj_list, []);
    ms_two_graph = $("#ms2_svg_graph").data("graph") as SpectrumView;
    ms_two_graph.redraw();
    $("#mass2Table .row_ref_mz").on('click', function (e) {
      // center the graph on the clicked ref m/z value
      let monoMz: number = parseFloat(e.currentTarget.innerHTML);
      ms_two_graph.getPara().updateMzRange(monoMz);
      ms_two_graph.redraw();
    });
    // keep the MS1 panel on this MS2 spectrum's precursor spectrum
    await syncMsOneToMsTwo();
  }
}

// Clicking a theoretical-peak circle in the MS1 or MS2 graph selects the
// envelope's row in that panel's mass list (highlighted and scrolled into
// view). The circles dispatch "envelopeclick" on the <svg> (see
// draw_spectrum.ts), so one listener per svg element covers every redraw.
function showEnvelopeInMassList(table: MassTable, panelId: string, envId: number): void {
  let rowNodes = table.rows().nodes();
  for (let i = 0; i < rowNodes.length; i++) {
    (rowNodes[i] as HTMLElement).classList.remove('env-selected');
  }
  // the mass ID column holds env_id + 1
  let row = table.row(function (idx: number, data: unknown[]) { return data[0] === envId + 1; });
  let node = row.node() as HTMLElement | null;
  if (!node) return;
  node.classList.add('env-selected');
  // scroll only inside the panel body, not the whole page
  let body: HTMLElement | null = document.querySelector('#' + panelId + ' .panel-body');
  if (body) {
    let target: number = node.offsetTop - (body.clientHeight - node.offsetHeight) / 2;
    body.scrollTop = Math.max(0, target);
  }
}

document.getElementById('ms1_svg_graph').addEventListener('envelopeclick', (e: Event) => {
  showEnvelopeInMassList(mass_table, 'mass1Panel', (e as EnvelopeClickEvent).detail.envelope.getId());
});
document.getElementById('ms2_svg_graph').addEventListener('envelopeclick', (e: Event) => {
  showEnvelopeInMassList(mass2_table, 'mass2Panel', (e as EnvelopeClickEvent).detail.envelope.getId());
});

ms_two_next_btn.addEventListener('click', async () => {
  let id: number = spec_data.getCurMsTwoId();
  if (id >= 0 && id < (spec_data.getMsTwoScanNum() - 1)) {
    id++;
    spec_data.setCurMsTwoId(id);
    updateMsTwoById(id);
  }
});

ms_two_prev_btn.addEventListener('click', async () => {
  let id: number = spec_data.getCurMsTwoId();
  if (id >= 1 && id < spec_data.getMsTwoScanNum()) {
    id--;
    spec_data.setCurMsTwoId(id);
    updateMsTwoById(id);
  }
});

async function queryMsTwoScan(): Promise<void> {
  let q: number = parseInt(query_ms_two_scan_input.value);
  if (isNaN(q)) {
    alert("Please input a valid scan number");
    return;
  }
  let r: IdRow | null = await window.electronAPI.getMsTwoIdByScan(q);
  if (r == null) {
    alert("Scan number not found");
    return;
  }
  let id: number = r.id;
  if (id >= 0 && id < spec_data.getMsTwoScanNum()) {
    spec_data.setCurMsTwoId(id);
    updateMsTwoById(id);
  } else {
    alert("Scan number not found");
  }
}

ms_two_go_btn.addEventListener('click', () => queryMsTwoScan());

query_ms_two_scan_input.addEventListener("keydown", function (event: KeyboardEvent) {
  if (event.key === "Enter") {
    queryMsTwoScan();
  }
});

ms_two_reset_btn.addEventListener('click', async () => {
  if (ms_two_graph != null) {
    ms_two_graph.getPara().resetScale();
    ms_two_graph.redraw();
  }
});

// Sequence matching lives in the shared visual inspection page: open it on
// the current MS2 spectrum (it loads the peaks, masses and ion types itself).
ms_two_inspect_btn.addEventListener('click', () => {
  let id: number = spec_data.getCurMsTwoId();
  if (id < 0) return;
  window.open('../topmsv/inspect/spectrum.html?spec_id=' + id, '_blank');
});

// Make the MS1 and MS2 panels draggable by their header. Resizing is handled
// by the native CSS `resize: both` on .spec-panel (see inspect.css).
$(function () {
  $('#ms1Panel, #ms2Panel, #mass1Panel, #mass2Panel').draggable({ handle: '.panel-header' });
});

// In the MS1 and MS2 panels, hide the scan info (Current..RT) while a hovered
// peak's m/z/intensity is shown, then restore it when the annotation clears. The
// annotation overlays the info slot (see CSS), and we use `visibility` so the
// scan info keeps its width and the header never re-wraps.
(function () {
  const pairs: [string, string][] = [
    ['curMsOneAnnoText', 'ms1ScanInfo'],
    ['curMsTwoAnnoText', 'ms2ScanInfo'],
  ];
  for (const [annoId, infoId] of pairs) {
    const anno: HTMLElement | null = document.getElementById(annoId);
    const info: HTMLElement | null = document.getElementById(infoId);
    if (!anno || !info) continue;
    const sync = () => { info.style.visibility = anno.textContent.trim() ? 'hidden' : 'visible'; };
    new MutationObserver(sync).observe(anno, { childList: true, characterData: true, subtree: true });
    sync();
  }
})();
