// Home page: dataset list + upload form. Compiled to public/js/home.js.

interface DatasetMeta {
  id: string;
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
}

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
    html += `<tr>
      <td>${esc(d.name)}${note}</td>
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

function setupUpload(): void {
  const form = document.getElementById('uploadForm') as HTMLFormElement;
  const btn = document.getElementById('uploadBtn') as HTMLButtonElement;
  const status = document.getElementById('uploadStatus') as HTMLElement;
  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const data = new FormData(form);
    btn.disabled = true;
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
      status.textContent = err instanceof Error ? err.message : String(err);
    } finally {
      btn.disabled = false;
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
