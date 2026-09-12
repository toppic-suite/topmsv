// Data access of the MS1 3D view: the dataset's /api/3d/... endpoints and
// the choice of resolution level for a view window.
import { Config3d, LevelConfig, PeakRow, ScanRow, ViewRange } from './types.js';

export class Ms1DataSource {
  private apiRoot: string;

  /** @param apiRoot - e.g. "../api/3d/" relative to the page */
  constructor(apiRoot: string) {
    this.apiRoot = apiRoot;
  }

  private async getJson<T>(path: string): Promise<T> {
    const res = await fetch(this.apiRoot + path);
    if (!res.ok) {
      let message = res.status + ' ' + res.statusText;
      try { message = (await res.json()).error || message; } catch { /* keep */ }
      throw new Error(message);
    }
    return res.json();
  }

  loadConfig(): Promise<Config3d> {
    return this.getJson<Config3d>('config');
  }

  loadScans(): Promise<ScanRow[]> {
    return this.getJson<ScanRow[]>('scans');
  }

  /**
   * Pick the level whose peak count is closest to the number of peaks the
   * whole run would need for the window to hold about `expectedPeaks`
   * peaks: zooming in selects finer levels.
   */
  chooseLevel(view: ViewRange, levels: LevelConfig[], expectedPeaks: number): number {
    const full = levels[0];
    const xRatio = Math.max(1e-9, (view.mzmax - view.mzmin) / (full.mzMax - full.mzMin));
    let yRatio = (view.rtmax - view.rtmin) / (full.rtMax - full.rtMin);
    if (yRatio <= 0) yRatio = 1;
    const wanted = expectedPeaks / (xRatio * yRatio);
    let best = levels.length - 1;
    let diff = Number.MAX_VALUE;
    levels.forEach((l) => {
      const d = Math.abs(l.count - wanted);
      if (d < diff) { diff = d; best = l.level; }
    });
    return best;
  }

  loadPeaks(view: ViewRange, level: number, maxPeaks: number, cutoff: number): Promise<PeakRow[]> {
    const q = new URLSearchParams({
      level: String(level),
      minMz: String(view.mzmin), maxMz: String(view.mzmax),
      minRt: String(view.rtmin), maxRt: String(view.rtmax),
      maxPeaks: String(maxPeaks), cutoff: String(cutoff),
    });
    return this.getJson<PeakRow[]>('peaks?' + q.toString());
  }
}
