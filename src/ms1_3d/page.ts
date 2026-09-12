// Entry of the MS1 3D view page (public/ms1_3d/ms1_3d.html): loads the
// dataset's 3D peak database through ../api/3d/, drives the graph and
// wires the controls. Loaded as an ES module; three.js resolves through
// the page's import map.
import { Ms1DataSource } from './data.js';
import { Ms1Graph } from './graph.js';
import { Ms1Interaction } from './interaction.js';
import { PeakRow, ScanRow, ViewRange } from './types.js';

function $<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error('missing element #' + id);
  return el as T;
}

function sci(n: number): string {
  return n.toExponential(2);
}

class Ms1Page {
  private source = new Ms1DataSource('../api/3d/');
  readonly graph: Ms1Graph;
  private status = $<HTMLElement>('status');
  private cutoffInput = $<HTMLInputElement>('cutoff');
  private busy = false;

  constructor() {
    this.graph = new Ms1Graph({
      container: $('graph-container'),
      onData: (peaks, view, sum) => this.showData(peaks, view, sum),
    });
    new Ms1Interaction(this.graph, {
      requestView: (view) => this.requestView(view),
      onCursor: (mz, rt, scan, e) => this.showCursor(mz, rt, scan, e),
    });
    this.wireControls();
  }

  /* ---- data flow */
  async init(): Promise<void> {
    try {
      this.setStatus('Loading...');
      const config = await this.source.loadConfig();
      this.graph.setDataRange(config.levels, config.totalIntensity);
      this.graph.scans = await this.source.loadScans();
      this.graph.setViewRangeToFull();
      await this.reload();
    } catch (err) {
      this.setStatus((err as Error).message, true);
    }
  }

  private cutoff(): number {
    const v = parseFloat(this.cutoffInput.value);
    return Number.isFinite(v) && v > 0 ? v : 0;
  }

  /** Fetch the peaks of the current window at the right level and draw them. */
  private async reload(): Promise<void> {
    const g = this.graph;
    const level = this.source.chooseLevel(g.viewRange, g.levels, Ms1Graph.maxPeaks);
    this.setStatus('Loading level ' + level + '...');
    const peaks: PeakRow[] = await this.source.loadPeaks(g.viewRange, level, Ms1Graph.maxPeaks, this.cutoff());
    g.draw(peaks);
    this.setStatus('Level ' + level + ' of ' + (g.levels.length - 1) + ' (0 = full resolution)');
    this.fillRangeBoxes();
  }

  private async requestView(view: ViewRange): Promise<void> {
    if (this.busy) return;
    this.busy = true;
    try {
      this.graph.setViewRange(view.mzmin, view.mzmax, view.rtmin, view.rtmax);
      await this.reload();
    } catch (err) {
      this.setStatus((err as Error).message, true);
    } finally {
      this.busy = false;
    }
  }

  /* ---- info panel */
  private setStatus(text: string, isError = false): void {
    this.status.textContent = text;
    this.status.classList.toggle('error', isError);
  }

  private showData(peaks: PeakRow[], view: ViewRange, sum: number): void {
    $('meta-max').textContent = peaks.length ? sci(view.intmax) : '0';
    $('meta-sum').textContent = peaks.length ? sci(sum) : '0';
    $('meta-count').textContent = String(peaks.length);
  }

  private showCursor(mz: number, rt: number, scan: ScanRow | null, e: MouseEvent): void {
    $('cursor-mz').textContent = mz < 0 ? '' : mz.toFixed(3);
    $('cursor-rt').textContent = rt < 0 ? '' : rt.toFixed(3);
    $('cursor-scan').textContent = scan ? String(scan.scan) : 'n/a';
    const tip = $('tooltip');
    if (e.ctrlKey && mz >= 0 && rt >= 0 && scan) {
      tip.style.display = 'block';
      tip.style.left = (e.clientX + 16) + 'px';
      tip.style.top = (e.clientY - 12) + 'px';
      tip.textContent = 'scan ' + scan.scan + '  m/z ' + mz.toFixed(3) + '  rt ' + rt.toFixed(3);
    } else {
      tip.style.display = 'none';
    }
  }

  private fillRangeBoxes(): void {
    const vr = this.graph.viewRange;
    $<HTMLInputElement>('rt-min').value = vr.rtmin.toFixed(3);
    $<HTMLInputElement>('rt-max').value = vr.rtmax.toFixed(3);
    $<HTMLInputElement>('mz-min').value = vr.mzmin.toFixed(3);
    $<HTMLInputElement>('mz-max').value = vr.mzmax.toFixed(3);
  }

  /* ---- controls */
  private wireControls(): void {
    const g = this.graph;
    $('request').addEventListener('click', () => {
      const rtmin = parseFloat($<HTMLInputElement>('rt-min').value);
      const rtmax = parseFloat($<HTMLInputElement>('rt-max').value);
      const mzmin = parseFloat($<HTMLInputElement>('mz-min').value);
      const mzmax = parseFloat($<HTMLInputElement>('mz-max').value);
      if ([rtmin, rtmax, mzmin, mzmax].some((v) => !Number.isFinite(v))) { alert('Enter numbers for all four range values.'); return; }
      if (rtmin >= rtmax) { alert('Invalid range: minimum retention time must be below the maximum.'); return; }
      if (mzmin >= mzmax) { alert('Invalid range: minimum m/z must be below the maximum.'); return; }
      if (this.cutoffInput.value.trim() !== '' && !Number.isFinite(parseFloat(this.cutoffInput.value))) { alert('Invalid cutoff value: enter a number.'); return; }
      void this.requestView({ mzmin, mzmax, mzrange: mzmax - mzmin, rtmin, rtmax, rtrange: rtmax - rtmin, intmin: 0, intmax: 0 });
    });
    $('reset').addEventListener('click', () => {
      this.cutoffInput.value = '';
      g.isHighlightingScan = $<HTMLInputElement>('highlight-scan').checked;
      g.curRt = -1;
      g.manualIntScale = 1;
      g.setViewRangeToFull();
      void this.requestView(g.viewRange);
    });
    $<HTMLSelectElement>('intensity-type').addEventListener('change', (e) => {
      g.isIntensityAbsolute = (e.target as HTMLSelectElement).value === 'absolute';
      g.drawNoNewData();
    });
    $<HTMLInputElement>('auto-scale').addEventListener('change', (e) => {
      g.autoScaleIntensity = (e.target as HTMLInputElement).checked;
      g.drawNoNewData();
    });
    $<HTMLInputElement>('highlight-scan').addEventListener('change', (e) => {
      g.isHighlightingScan = (e.target as HTMLInputElement).checked;
      g.drawNoNewData();
    });
    $('save').addEventListener('click', () => {
      const a = document.createElement('a');
      a.href = g.toDataURL();
      a.download = 'ms1_3d.png';
      a.click();
    });
    $('expand').addEventListener('click', () => { g.viewSize = Math.max(6, g.viewSize - 3); g.applyCameraSize(); });
    $('shrink').addEventListener('click', () => { g.viewSize += 3; g.applyCameraSize(); });
    $('fullscreen').addEventListener('click', () => {
      const el = $('graph-container');
      if (document.fullscreenElement) { void document.exitFullscreen(); }
      else { void el.requestFullscreen(); }
    });
    document.addEventListener('fullscreenchange', () => g.resize());
    $('cutoff').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('request').click(); });
  }
}

const page = new Ms1Page();
// exposed for debugging / automated checks
(window as unknown as { ms1Page: Ms1Page }).ms1Page = page;
void page.init();
