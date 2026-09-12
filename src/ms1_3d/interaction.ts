// Mouse interaction of the MS1 3D view: left drag pans, the wheel zooms
// the axis under the cursor (both inside the plot), ctrl + wheel scales
// intensities, ctrl + click highlights the nearest scan; mouse moves
// report the cursor position. Rotation (right drag) is OrbitControls'.
import * as THREE from 'three';
import { Ms1Graph } from './graph.js';
import { ScanRow, ViewRange } from './types.js';

export interface InteractionCallbacks {
  /** load data for a new window and redraw */
  requestView: (view: ViewRange) => Promise<void>;
  /** cursor moved: m/z, rt (-1 outside the view) and the nearest scan */
  onCursor: (mz: number, rt: number, scan: ScanRow | null, event: MouseEvent) => void;
}

export class Ms1Interaction {
  private graph: Ms1Graph;
  private cb: InteractionCallbacks;
  private mouseDown = false;
  private mstart: THREE.Vector3 | null = null;
  private scrollLock = false;

  constructor(graph: Ms1Graph, callbacks: InteractionCallbacks) {
    this.graph = graph;
    this.cb = callbacks;
    const el = graph.renderer.domElement;
    el.addEventListener('mousedown', (e) => this.onMouseDown(e));
    el.addEventListener('mousemove', (e) => this.onMouseMove(e));
    el.addEventListener('mouseup', (e) => this.onMouseUp(e));
    el.addEventListener('mouseleave', () => { this.mstart = null; this.mouseDown = false; });
    el.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });
    el.addEventListener('click', (e) => this.onClick(e));
  }

  /* ---- pan */
  private pannedRange(dx: number, dz: number): ViewRange {
    const vr = this.graph.viewRange;
    this.graph.isPan = true;
    return this.graph.constrainBoundsPan(vr.mzmin + dx * vr.mzrange, vr.mzrange, vr.rtmin + dz * vr.rtrange, vr.rtrange);
  }

  private onMouseDown(e: MouseEvent): void {
    if (e.button !== 0) return;
    this.mouseDown = true;
    this.mstart = this.graph.getMousePosition(e).clone();
  }

  private onMouseMove(e: MouseEvent): void {
    const [mz, rt] = this.graph.getMzRt(e);
    this.cb.onCursor(mz, rt, rt >= 0 ? this.graph.findNearestScan(rt) : null, e);
    if (this.mstart && this.mouseDown) {
      const mend = this.graph.getMousePosition(e);
      const delta = new THREE.Vector3().subVectors(mend, this.mstart);
      // move the loaded peaks while dragging; data is reloaded on release
      const r = this.pannedRange(-delta.x, -delta.z);
      this.graph.setViewRange(r.mzmin, r.mzmax, r.rtmin, r.rtmax);
      this.graph.drawNoNewData();
      this.mstart.copy(mend);
    }
  }

  private onMouseUp(e: MouseEvent): void {
    if (this.mstart) {
      const mend = this.graph.getMousePosition(e);
      const delta = new THREE.Vector3().subVectors(mend, this.mstart);
      const r = this.pannedRange(-delta.x, -delta.z);
      void this.cb.requestView(r);
    }
    this.mstart = null;
    this.mouseDown = false;
  }

  /* ---- zoom */
  private onWheel(e: WheelEvent): void {
    e.preventDefault();
    if (this.scrollLock) return;
    this.scrollLock = true;
    try {
      if (e.ctrlKey) {
        this.graph.scaleIntensity(e.deltaY > 0 ? 0.75 : 1.5);
      } else {
        this.zoomAt(e);
      }
    } finally {
      this.scrollLock = false;
    }
  }

  private zoomAt(e: WheelEvent): void {
    const g = this.graph;
    const vr = g.viewRange;
    const p = g.getMousePosition(e);
    const curmz = p.x * vr.mzrange + vr.mzmin;
    const currt = p.z * vr.rtrange + vr.rtmin;
    const scale = e.deltaY < 0 ? 0.8 : 1.2;
    const inMz = curmz >= vr.mzmin && curmz <= vr.mzmax;
    const inRt = currt >= vr.rtmin && currt <= vr.rtmax;
    let newmzrange = vr.mzrange;
    let newrtrange = vr.rtrange;
    if (inMz && inRt) { newmzrange *= scale; newrtrange *= scale; }
    else if (inMz) { newmzrange *= scale; }
    else if (inRt) { newrtrange *= scale; }
    else return;
    // keep the point under the cursor in place
    const mzscale = (curmz - vr.mzmin) / vr.mzrange;
    const rtscale = (currt - vr.rtmin) / vr.rtrange;
    const r = g.constrainBoundsZoom(curmz - mzscale * newmzrange, newmzrange, currt - rtscale * newrtrange, newrtrange);
    void this.cb.requestView(r);
  }

  /* ---- scan highlight */
  private onClick(e: MouseEvent): void {
    if (!e.ctrlKey) return;
    const [, rt] = this.graph.getMzRt(e);
    if (rt < 0) return;
    const scan = this.graph.findNearestScan(rt);
    if (scan) {
      this.graph.curRt = scan.rt;
      this.graph.isHighlightingScan = true;
      this.graph.drawNoNewData();
    }
  }
}
