// Home page: dataset list + upload form. Compiled to public/common/js/home.js
// (after sqlite_reader.ts and upload_check.ts, whose globals it uses).

type DatasetType = 'topfd' | 'topfd_toppic' | 'topfd_topmg' | 'topdia';

interface DatasetMeta {
  id: string;
  type: DatasetType;
  name: string;
  createdAt: string;
  hasIdentifications: boolean;   // the sqlite holds the TopPIC identification tables
  prsmCount: number;
  proteoformCount: number;
  proteinCount: number;
  ms1Count: number;
  ms2Count: number;
  hasFasta: boolean;
  has3d: boolean;          // the sqlite holds the MS1 3D peak tables
  files?: string[];        // the uploaded files, the spectra file first (absent for older datasets)
  compressed?: boolean[];  // per file: compressed with sqlite-zstd (toppic_test experiment 172)
}

// The four types of datasets (toppic_test experiment 170): the name the
// dataset list shows, the tool that wrote each file of the upload form
// (searchTool null: the type has no second file) and the upload fields.
const TYPES: Record<DatasetType, { label: string; spectraTool: 'TopFD' | 'TopDIA'; spectraField: string;
  searchTool: 'TopPIC' | 'TopMG' | null; searchField: string }> = {
  topfd: { label: 'TopFD', spectraTool: 'TopFD', spectraField: 'sqlite', searchTool: null, searchField: '' },
  topfd_toppic: { label: 'TopFD + TopPIC', spectraTool: 'TopFD', spectraField: 'sqlite',
    searchTool: 'TopPIC', searchField: 'toppic_sqlite' },
  topfd_topmg: { label: 'TopFD + TopMG', spectraTool: 'TopFD', spectraField: 'sqlite',
    searchTool: 'TopMG', searchField: 'topmg_sqlite' },
  topdia: { label: 'TopDIA', spectraTool: 'TopDIA', spectraField: 'topdia_sqlite', searchTool: null, searchField: '' },
};

async function fetchDatasets(): Promise<DatasetMeta[]> {
  const res = await fetch('api/datasets');
  if (!res.ok) throw new Error('failed to list datasets');
  return res.json();
}

function esc(s: string): string {
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}

// true when the server runs with --view-only (set by applyServerConfig)
let viewOnly = false;

function renderDatasets(list: DatasetMeta[]): void {
  const container = document.getElementById('datasetList') as HTMLElement;
  if (list.length === 0) {
    container.innerHTML = viewOnly
      ? '<p class="hint">No datasets available.</p>'
      : '<p class="hint">No datasets yet. Upload one above.</p>';
    return;
  }
  let html = '<table class="datasets"><thead><tr>'
    + '<th>Name</th><th>Created</th><th>Proteins</th><th>Proteoforms</th><th>PrSMs</th>'
    + '<th>MS1 / MS2 scans</th><th>Open</th>' + (viewOnly ? '' : '<th></th>')
    + '</tr></thead><tbody>';
  for (const d of list) {
    const created = new Date(d.createdAt).toLocaleString();
    const ds = encodeURIComponent(d.id);
    let note = '';
    if (!d.hasIdentifications) {
      note = ' <span class="hint" title="The sqlite file has no TopPIC identification tables">(spectra only)</span>';
    } else if (!d.hasFasta) {
      note = ' <span class="hint" title="The sqlite file has no search database (fasta_seq)">(no database)</span>';
    }
    // a dataset without identification tables has no identification pages
    const count = (n: number) => (d.hasIdentifications ? String(n) : '&ndash;');
    const identLink = d.hasIdentifications
      ? `<a href="d/${ds}/topmsv/visual/proteins.html?data=toppic_proteoform_cutoff">Identifications</a>`
      : '';
    const type = TYPES[d.type]?.label ?? '';
    // each file with "(compressed)" when it is compressed with sqlite-zstd
    const fileLabel = (f: string, i: number) => esc(f) + (d.compressed?.[i]
      ? ' <span title="compressed with sqlite-zstd">(compressed)</span>' : '');
    const files = d.files && d.files.length > 0
      ? `<div class="hint files">${esc(type)}: ${d.files.map(fileLabel).join(' + ')}</div>`
      : `<div class="hint files">${esc(type)}${d.compressed?.some((c) => c) ? ' (compressed)' : ''}</div>`;
    html += `<tr>
      <td>${esc(d.name)}${note}${files}</td>
      <td>${esc(created)}</td>
      <td class="num">${count(d.proteinCount)}</td>
      <td class="num">${count(d.proteoformCount)}</td>
      <td class="num">${count(d.prsmCount)}</td>
      <td class="num">${d.ms1Count} / ${d.ms2Count}</td>
      <td class="actions">
        ${identLink}
        <a href="d/${ds}/spectra/spectra.html">Spectra</a>
        ${d.has3d ? `<a href="d/${ds}/ms1_3d/ms1_3d.html">MS1 3D</a>` : ''}
      </td>
      ${viewOnly ? '' : `<td><button class="danger" data-id="${esc(d.id)}">Delete</button></td>`}
    </tr>`;
  }
  html += '</tbody></table>';
  container.innerHTML = html;
  for (const btn of Array.from(container.querySelectorAll('button.danger'))) {
    btn.addEventListener('click', async () => {
      const id = (btn as HTMLButtonElement).dataset.id as string;
      if (!confirm(`Delete dataset "${id}"? This cannot be undone.`)) return;
      const res = await fetch('api/datasets/' + encodeURIComponent(id), { method: 'DELETE' });
      if (!res.ok) alert('Delete failed');
      refresh();
    });
  }
}

async function refresh(): Promise<void> {
  try {
    renderDatasets(await fetchDatasets());
  } catch (err) {
    const container = document.getElementById('datasetList') as HTMLElement;
    container.innerHTML = '<p class="hint">Failed to load dataset list.</p>';
  }
}

// The upload form: the dataset type (radio buttons) and the files of the
// type, the TopFD or TopDIA file and, for TopFD + TopPIC or TopFD + TopMG,
// the TopPIC or TopMG file. Each file is checked in the browser when it is
// selected (upload_check.ts), against the chosen type, and Upload is enabled
// only once the files of the type pass their checks, so that a file that is
// not what the type needs, or a TopPIC or TopMG file of another TopFD file,
// is reported before it is uploaded (the server checks the files again).
function setupUpload(): void {
  const el = (id: string) => document.getElementById(id) as HTMLElement;
  const form = el('uploadForm') as HTMLFormElement;
  const btn = el('uploadBtn') as HTMLButtonElement;
  const status = el('uploadStatus');
  const spectraInput = el('spectraInput') as HTMLInputElement;
  const searchInput = el('searchInput') as HTMLInputElement;
  let spectra: SpectraFileInfo | null = null;   // the first file, once it was read as a TopFD or TopDIA file
  let search: SearchFileInfo | null = null;     // the second file, once it passed its check
  // the latest check of each input: the result of an earlier one is dropped
  let spectraCheck = 0;
  let searchCheck = 0;
  let uploading = false;

  const show = (target: HTMLElement, text: string, state: '' | 'ok' | 'warning' | 'pending') => {
    target.textContent = text;
    target.className = 'filestatus' + (state ? ' ' + state : '');
  };
  const reason = (err: unknown) => (err instanceof Error ? err.message : String(err));
  const currentType = (): DatasetType =>
    ((form.querySelector('input[name="type"]:checked') as HTMLInputElement | null)?.value ?? 'topfd_toppic') as DatasetType;
  // the first file is a file of the type's tool
  const spectraOk = () => spectra !== null && spectra.tool === TYPES[currentType()].spectraTool;
  // the files of the type passed their checks
  const ready = () => spectraOk() && (TYPES[currentType()].searchTool === null || search !== null);
  const update = () => { btn.disabled = uploading || !ready(); };
  // the file inputs of the chosen type: their labels, and the second file's
  // row only for a type with a TopPIC or TopMG file
  const showType = () => {
    const t = TYPES[currentType()];
    el('spectraLabel').textContent = `${t.spectraTool} sqlite file`;
    el('searchRow').hidden = t.searchTool === null;
    if (t.searchTool) el('searchLabel').textContent = `${t.searchTool} sqlite file`;
  };
  // the first file's status once it was read: what it is, or a warning when
  // the type needs a file of the other tool
  const showSpectra = () => {
    if (!spectra) return;
    const target = el('spectraStatus');
    const counts = `${spectra.ms1Num.toLocaleString()} MS1 and ${spectra.ms2Scans.size.toLocaleString()} MS/MS spectra`;
    if (spectraOk()) {
      show(target, `${spectra.tool} file: ${counts}.`, 'ok');
    } else if (spectra.tool === 'TopDIA') {
      show(target, 'Warning: it is a TopDIA file (none of its MS/MS spectra is linked to an MS1 spectrum), not a '
        + 'TopFD file: choose the dataset type TopDIA only. The file cannot be uploaded.', 'warning');
    } else {
      show(target, 'Warning: it is a TopFD file (its MS/MS spectra are linked to MS1 spectra), not a TopDIA file: '
        + 'choose a TopFD dataset type. The file cannot be uploaded.', 'warning');
    }
  };

  const checkSearch = async () => {
    const check = ++searchCheck;
    search = null;
    const tool = TYPES[currentType()].searchTool;
    const file = searchInput.files?.[0];
    const target = el('searchStatus');
    if (!tool || !file) {
      show(target, '', '');
      update();
      return;
    }
    if (!spectra || !spectraOk()) {
      show(target, 'Checked once the TopFD file has passed its check.', '');
      update();
      return;
    }
    show(target, 'Checking the file…', 'pending');
    update();
    try {
      const info = await checkSearchFile(file, spectra, tool);
      if (check !== searchCheck) return;
      search = info;
      show(target, `${info.tool} file of the TopFD file (checked: ${info.note}).`, 'ok');
    } catch (err) {
      if (check !== searchCheck) return;
      show(target, `Warning: ${reason(err)}. The files cannot be uploaded.`, 'warning');
    }
    update();
  };

  const checkSpectra = async () => {
    const check = ++spectraCheck;
    spectra = null;
    const file = spectraInput.files?.[0];
    const target = el('spectraStatus');
    // a TopPIC or TopMG file selected before is checked against this file once it passed
    void checkSearch();
    if (!file) {
      show(target, '', '');
      return;
    }
    show(target, 'Checking the file…', 'pending');
    try {
      const info = await inspectSpectraFile(file);
      if (check !== spectraCheck) return;
      spectra = info;
      showSpectra();
    } catch (err) {
      if (check !== spectraCheck) return;
      show(target, `Warning: ${reason(err)}. The file cannot be uploaded.`, 'warning');
    }
    await checkSearch();
  };

  for (const radio of Array.from(form.querySelectorAll('input[name="type"]'))) {
    radio.addEventListener('change', () => {
      showType();
      showSpectra();
      void checkSearch();
    });
  }
  spectraInput.addEventListener('change', () => { void checkSpectra(); });
  searchInput.addEventListener('change', () => { void checkSearch(); });
  form.addEventListener('reset', () => setTimeout(() => { showType(); void checkSpectra(); }, 0));
  showType();
  // a browser that restores the inputs' files on reload
  void checkSpectra();

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const t = TYPES[currentType()];
    const spectraFile = spectraInput.files?.[0];
    const searchFile = t.searchTool ? searchInput.files?.[0] : undefined;
    if (uploading || !ready() || !spectraFile || (t.searchTool && !searchFile)) return;
    const data = new FormData();
    data.append('name', (el('nameInput') as HTMLInputElement).value);
    data.append(t.spectraField, spectraFile);
    if (searchFile) data.append(t.searchField, searchFile);
    uploading = true;
    update();
    status.classList.remove('error');
    status.textContent = 'Uploading… this may take a moment for large files.';
    try {
      const res = await fetch('api/datasets', { method: 'POST', body: data });
      // A reverse proxy in front of the app (e.g. nginx's default 1 MB
      // client_max_body_size -> 413) answers with an HTML page, not JSON.
      const text = await res.text();
      let body: { name?: string; error?: string } = {};
      try {
        body = JSON.parse(text);
      } catch {
        throw new Error(`upload failed: HTTP ${res.status} ${res.statusText}`.trim());
      }
      if (!res.ok) throw new Error(body.error || 'upload failed');
      status.textContent = `Dataset "${body.name}" is ready.`;
      form.reset();
      refresh();
    } catch (err) {
      status.classList.add('error');
      status.textContent = reason(err);
    } finally {
      uploading = false;
      update();
    }
  });
}

/**
 * Apply the server configuration: show the application version (from
 * package.json via the server) and, when the server was started with
 * --view-only, hide the upload panel (the dataset list then omits the Delete
 * buttons).
 */
async function applyServerConfig(): Promise<void> {
  try {
    const res = await fetch('api/config');
    if (!res.ok) return;
    const body = await res.json();
    const versionEl = document.getElementById('appVersion');
    if (versionEl && typeof body.version === 'string') versionEl.textContent = 'v' + body.version;
    if (body.viewOnly === true) {
      viewOnly = true;
      const panel = document.getElementById('uploadPanel');
      if (panel) panel.hidden = true;
    }
  } catch {
    /* leave the page as it is */
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  setupUpload();
  // the config decides whether the list shows Delete buttons: load it first
  await applyServerConfig();
  refresh();
});
