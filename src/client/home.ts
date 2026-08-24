// Home page: dataset list + upload form. Compiled to public/js/home.js.

interface DatasetMeta {
  id: string;
  name: string;
  createdAt: string;
  prsmCount: number;
  proteoformCount: number;
  proteinCount: number;
  ms1Count: number;
  ms2Count: number;
  hasFasta: boolean;
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

function renderDatasets(list: DatasetMeta[]): void {
  const container = document.getElementById('datasetList') as HTMLElement;
  if (list.length === 0) {
    container.innerHTML = '<p class="hint">No datasets yet. Upload one above.</p>';
    return;
  }
  let html = '<table class="datasets"><thead><tr>'
    + '<th>Name</th><th>Created</th><th>Proteins</th><th>Proteoforms</th><th>PrSMs</th>'
    + '<th>MS1 / MS2 scans</th><th>Open</th><th></th>'
    + '</tr></thead><tbody>';
  for (const d of list) {
    const created = new Date(d.createdAt).toLocaleString();
    html += `<tr>
      <td>${esc(d.name)}${d.hasFasta ? '' : ' <span class="hint" title="Uploaded without a FASTA database">(no FASTA)</span>'}</td>
      <td>${esc(created)}</td>
      <td class="num">${d.proteinCount}</td>
      <td class="num">${d.proteoformCount}</td>
      <td class="num">${d.prsmCount}</td>
      <td class="num">${d.ms1Count} / ${d.ms2Count}</td>
      <td>
        <a href="d/${encodeURIComponent(d.id)}/topmsv/index.html">Identifications</a>
        <a href="d/${encodeURIComponent(d.id)}/spectra.html">Raw spectra</a>
      </td>
      <td><button class="danger" data-id="${esc(d.id)}">Delete</button></td>
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
    status.textContent = 'Uploading and converting… this may take a moment for large files.';
    try {
      const res = await fetch('api/datasets', { method: 'POST', body: data });
      const body = await res.json();
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

document.addEventListener('DOMContentLoaded', () => {
  setupUpload();
  refresh();
});
