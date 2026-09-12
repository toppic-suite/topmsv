// The MS1 3D peak view: a three.js orthographic scene with a grid plane
// (m/z along x, retention time along z) and one vertical line per peak
// (height = intensity). Ported from the TopMSV server's 3d_graph code
// (graph, graph_init, graph_control, graph_data, graph_label, graph_render,
// graph_util) into one class; data loading lives in data.ts and mouse
// interaction in interaction.ts.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { LevelConfig, PeakRow, ScanRow, ViewRange } from './types.js';

/** A peak line with the data it stands for. */
export interface PeakLine extends THREE.Line {
  mz: number; rt: number; int: number; height: number; lowPeak: boolean;
}

export interface GraphOptions {
  container: HTMLElement;
  /** called after every redraw with the peaks on display */
  onData?: (peaks: PeakRow[], view: ViewRange, intensitySum: number) => void;
}

export class Ms1Graph {
  /* graph and grid size (world units) */
  static readonly gridRange = 20;
  static readonly gridRangeVertical = 6;
  viewSize = 25;                 // camera frustum height; +/- buttons change it

  /* rounding of tick labels */
  static readonly roundMz = 3;
  static readonly roundRt = 3;

  /* peak display */
  static readonly maxPeaks = 4000;         // lines allocated once, reused on redraw
  static readonly minPeakHeight = 0.1;
  static readonly maxPeakHeight = 15;
  static readonly lowInteScaleFactor = 1000;
  static readonly lowInteThreshold = 0.005; // scale up when maxInt/total is below this

  static readonly currentScanColor = '#ff5797';
  static readonly surfaceColor = '#000030';
  static readonly gridColor = '#555555';
  static readonly peakColor: string[] = ['#0000ff', '#007fff', '#00ffff', '#7fff7f', '#ffff00', '#ff7f00', '#ff0000'];

  static readonly xTickNum = 10;
  static readonly yTickNum = 10;
  static readonly tickWidthList = [10000, 8000, 6000, 5000, 4000, 3000, 2000, 1000, 800, 700, 600, 500, 450, 400, 350, 300, 250, 200, 150, 100, 50, 20, 10, 5, 3, 2, 1, 0.5, 0.2, 0.1, 0.05, 0.01, 0.005, 0.001, 0.0005, 0.0001, 0.00005, 0.00001, 0.000005, 0.000001];
  static readonly tickHeightList = [50, 40, 30, 25, 20, 15, 10, 5, 3, 2, 1, 0.5, 0.2, 0.1, 0.05, 0.01, 0.005, 0.001, 0.0005, 0.0001, 0.00005, 0.00001, 0.000005, 0.000001];

  /* scene */
  readonly container: HTMLElement;
  readonly scene = new THREE.Scene();
  readonly renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  readonly camera = new THREE.OrthographicCamera(-50, 50, -10, 10, 1, 100);
  readonly graphPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  readonly controls: OrbitControls;
  readonly rangeTransform = new THREE.Vector3(1 / Ms1Graph.gridRange, 1 / Ms1Graph.gridRangeVertical, 1 / Ms1Graph.gridRange);

  readonly gridGroup = new THREE.Group();
  readonly dataGroup = new THREE.Group();     // scaled from (m/z, intensity, rt) to grid units
  readonly plotGroup = new THREE.Group();     // 3D peak lines (child of dataGroup)
  readonly peak2DGroup = new THREE.Group();   // flat peak lines of the top-down view
  readonly ticksGroup = new THREE.Group();    // child of dataGroup
  readonly tickLabelGroup = new THREE.Group();
  readonly labelGroup = new THREE.Group();
  readonly markerGroup = new THREE.Group();   // highlighted scan line
  readonly axisGroup = new THREE.Group();

  /* data */
  levels: LevelConfig[] = [];
  dataRange: ViewRange = Ms1Graph.emptyRange();
  viewRange: ViewRange = Ms1Graph.emptyRange();
  currentData: PeakRow[] = [];
  scans: ScanRow[] = [];
  intensitySum = 0;              // of the peaks on display
  intensitySumTotal = 1;         // of the whole run (config)
  curRt = -1;                    // highlighted scan RT (minutes), -1 = none

  /* state */
  isPerpendicular = false;       // top-down 2D view
  isHighlightingScan = false;
  isIntensityAbsolute = true;    // color by the converter's class, else by relative intensity
  autoScaleIntensity = true;
  isPan = false;                 // skip auto intensity scaling for a pan
  intSquish = 1;

  private onData?: GraphOptions['onData'];

  constructor(options: GraphOptions) {
    this.container = options.container;
    this.onData = options.onData;
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.initGroups();
    this.initPlotGroups();
    this.initMarker();
    this.initRenderer();
    this.camera.position.set(15, 15, 30);
    this.initControls();
    this.createPlane();
    this.createAxis();
    this.drawAxisTitles();
    window.addEventListener('resize', () => this.resize());
    this.resize();
  }

  static emptyRange(): ViewRange {
    return { mzmin: 0, mzmax: 0, mzrange: 0, rtmin: 0, rtmax: 0, rtrange: 0, intmin: 0, intmax: 0 };
  }

  /* ------------------------------------------------------------ setup */
  private initGroups(): void {
    this.gridGroup.name = 'gridGroup';
    this.dataGroup.name = 'dataGroup';
    this.plotGroup.name = 'plotGroup';
    this.peak2DGroup.name = 'peak2DGroup';
    this.ticksGroup.name = 'ticksGroup';
    this.tickLabelGroup.name = 'tickLabelGroup';
    this.labelGroup.name = 'labelGroup';
    this.markerGroup.name = 'markerGroup';
    this.axisGroup.name = 'axisGroup';
    this.dataGroup.add(this.plotGroup);
    this.dataGroup.add(this.ticksGroup);
    this.scene.add(this.gridGroup, this.dataGroup, this.labelGroup, this.tickLabelGroup, this.markerGroup, this.axisGroup);
  }

  private static makePeakLine(dy: number): PeakLine {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([0, 0, 0, 0, dy, 0]), 3));
    const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 'white' })) as unknown as PeakLine;
    line.mz = 0; line.rt = 0; line.int = 0; line.height = 0; line.lowPeak = false;
    line.name = 'peak';
    line.visible = false;
    return line;
  }

  private initPlotGroups(): void {
    for (let i = 0; i < Ms1Graph.maxPeaks; i++) {
      this.plotGroup.add(Ms1Graph.makePeakLine(0.1));
      this.peak2DGroup.add(Ms1Graph.makePeakLine(0));
    }
  }

  private initMarker(): void {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([0, 0, 0, Ms1Graph.gridRange, 0, 0]), 3));
    const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: Ms1Graph.currentScanColor }));
    line.visible = false;
    line.name = 'currentScanMarker';
    this.markerGroup.add(line);
  }

  private initRenderer(): void {
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setClearColor(0xEEEEEE, 1);
    this.renderer.domElement.id = 'canvas3D';
    this.container.appendChild(this.renderer.domElement);
  }

  private initControls(): void {
    // right button rotates; pan and zoom are implemented in interaction.ts
    this.controls.mouseButtons = { LEFT: null, MIDDLE: null, RIGHT: THREE.MOUSE.ROTATE };
    this.controls.target.set(Ms1Graph.gridRange / 2, 0, Ms1Graph.gridRange / 2);
    this.controls.enablePan = false;
    this.controls.enableZoom = false;
    this.controls.addEventListener('change', () => this.checkAndRender());
    this.controls.update();
  }

  private createPlane(): void {
    const surface = new THREE.Mesh(
      new THREE.PlaneGeometry(Ms1Graph.gridRange, Ms1Graph.gridRange),
      new THREE.MeshBasicMaterial({ color: Ms1Graph.surfaceColor, side: THREE.DoubleSide }));
    surface.rotateX(Math.PI / 2);
    surface.position.set(Ms1Graph.gridRange / 2, -0.05, Ms1Graph.gridRange / 2);
    this.gridGroup.add(surface);
    const material = new THREE.LineBasicMaterial({ color: Ms1Graph.gridColor });
    for (let i = 0; i <= Ms1Graph.gridRange; i++) {
      const points = [
        new THREE.Vector3(i, 0, 0), new THREE.Vector3(i, 0, Ms1Graph.gridRange),
        new THREE.Vector3(0, 0, i), new THREE.Vector3(Ms1Graph.gridRange, 0, i),
      ];
      this.gridGroup.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(points), material));
    }
  }

  private createAxis(): void {
    const g = Ms1Graph.gridRange;
    const material = new THREE.LineBasicMaterial({ color: Ms1Graph.gridColor });
    const segs = [
      [new THREE.Vector3(0, 0, g), new THREE.Vector3(0, 0, 0)],
      [new THREE.Vector3(g, 0, g), new THREE.Vector3(0, 0, g)],
      [new THREE.Vector3(g, 0, g), new THREE.Vector3(g, 0, 0)],
      [new THREE.Vector3(g, 0, 0), new THREE.Vector3(0, 0, 0)],
    ];
    segs.forEach((pts) => this.axisGroup.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), material)));
  }

  private drawAxisTitles(): void {
    const mz = Ms1Graph.makeTextSprite('m/z', 16);
    mz.position.set(Ms1Graph.gridRange / 2, 0, Ms1Graph.gridRange + 3);
    const rt = Ms1Graph.makeTextSprite('retention time (min)', 16);
    rt.position.set(-4.5, 0, Ms1Graph.gridRange / 2);
    this.labelGroup.add(mz, rt);
  }

  /* ------------------------------------------------------------ rendering */
  resize(): void {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    if (w === 0 || h === 0) return;
    this.renderer.setSize(w, h, true);
    this.applyCameraSize();
  }

  /** Fit the frustum to viewSize and the canvas aspect ratio. */
  applyCameraSize(): void {
    const size = new THREE.Vector2();
    this.renderer.getSize(size);
    const aspect = size.x / size.y;
    const vs = this.viewSize;
    if (aspect > 1) {
      this.camera.left = -vs * aspect / 2; this.camera.right = vs * aspect / 2;
      this.camera.top = vs / 2; this.camera.bottom = -vs / 2;
    } else {
      this.camera.left = -vs / 2; this.camera.right = vs / 2;
      this.camera.top = vs / aspect / 2; this.camera.bottom = -vs / aspect / 2;
    }
    this.camera.updateProjectionMatrix();
    this.render();
  }

  render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  /** After a rotation: switch between the 3D lines and the flat top-down view. */
  checkAndRender(): void {
    if (this.currentData.length > 0) {
      // the orbit radius is |(15,15,30)-(10,0,10)| = 25.495: y reaches it only when looking straight down
      if (this.camera.position.y > 25.49) {
        this.isPerpendicular = true;
        this.plotPoint2D();
      } else if (this.isPerpendicular) {
        this.isPerpendicular = false;
        this.dataGroup.remove(this.peak2DGroup);
        this.updatePeaks(this.currentData);
      }
    }
    this.render();
  }

  /* ------------------------------------------------------------ ranges */
  setDataRange(levels: LevelConfig[], totalIntensity: number): void {
    this.levels = levels;
    const full = levels[0];
    this.dataRange = {
      mzmin: full.mzMin, mzmax: full.mzMax, mzrange: full.mzMax - full.mzMin,
      rtmin: full.rtMin, rtmax: full.rtMax, rtrange: full.rtMax - full.rtMin,
      intmin: full.intMin, intmax: full.intMax,
    };
    this.intensitySumTotal = totalIntensity > 0 ? totalIntensity : 1;
    this.plotGroup.scale.set(1, Ms1Graph.maxPeakHeight / this.dataRange.intmax, 1);
  }

  setViewRange(mzmin: number, mzmax: number, rtmin: number, rtmax: number): void {
    const d = this.dataRange;
    if (rtmax > d.rtmax) rtmax = d.rtmax;
    if (rtmin < d.rtmin) rtmin = d.rtmin;
    if (mzmin < d.mzmin) mzmin = d.mzmin;
    if (mzmax > d.mzmax) mzmax = d.mzmax;
    this.viewRange.mzmin = mzmin; this.viewRange.mzmax = mzmax; this.viewRange.mzrange = mzmax - mzmin;
    this.viewRange.rtmin = rtmin; this.viewRange.rtmax = rtmax; this.viewRange.rtrange = rtmax - rtmin;
  }

  setViewRangeToFull(): void {
    const d = this.dataRange;
    this.setViewRange(d.mzmin, d.mzmax, d.rtmin, d.rtmax);
  }

  /** Keep a zoomed window inside the data and above a minimum size. */
  constrainBoundsZoom(mzmin: number, mzrange: number, rtmin: number, rtrange: number): ViewRange {
    const d = this.dataRange;
    if (rtrange < 0.01) rtrange = 0.01;
    if (mzrange < 0.01) mzrange = 0.01;
    if (mzmin < d.mzmin) mzmin = d.mzmin;
    if (rtmin < d.rtmin) rtmin = d.rtmin;
    if (mzmin + mzrange > d.mzmax) mzrange = d.mzmax - mzmin;
    if (rtmin + rtrange > d.rtmax) rtrange = d.rtmax - rtmin;
    return { mzmin, mzmax: mzmin + mzrange, mzrange, rtmin, rtmax: rtmin + rtrange, rtrange, intmin: 0, intmax: 0 };
  }

  /** Keep a panned window inside the data (no pan past the edge). */
  constrainBoundsPan(mzmin: number, mzrange: number, rtmin: number, rtrange: number): ViewRange {
    const d = this.dataRange;
    if (mzmin < d.mzmin) mzmin = d.mzmin;
    if (rtmin < d.rtmin) rtmin = d.rtmin;
    let mzmax = mzmin + mzrange;
    let rtmax = rtmin + rtrange;
    if (mzmax > d.mzmax) { mzmax = d.mzmax; mzmin = Math.max(d.mzmin, mzmax - mzrange); }
    if (rtmax > d.rtmax) { rtmax = d.rtmax; rtmin = Math.max(d.rtmin, rtmax - rtrange); }
    return { mzmin, mzmax, mzrange: mzmax - mzmin, rtmin, rtmax, rtrange: rtmax - rtmin, intmin: 0, intmax: 0 };
  }

  /* ------------------------------------------------------------ coordinates */
  /** (m/z, rt) -> grid space (0..gridRange); RT runs toward z = 0 */
  mzRtToGridSpace(mz: number, rt: number): { x: number, z: number } {
    const vr = this.viewRange;
    const mzNorm = (mz - vr.mzmin) / vr.mzrange;
    const rtNorm = (rt - vr.rtmin) / vr.rtrange;
    return { x: mzNorm * Ms1Graph.gridRange, z: (1 - rtNorm) * Ms1Graph.gridRange };
  }

  /** Mouse event -> fractional position on the graph plane (x, z in 0..1 inside the grid). */
  getMousePosition(event: MouseEvent): THREE.Vector3 {
    const el = this.renderer.domElement;
    const rect = el.getBoundingClientRect();
    const coord = new THREE.Vector2(
      ((event.clientX - rect.left) / el.offsetWidth) * 2 - 1,
      -((event.clientY - rect.top) / el.offsetHeight) * 2 + 1);
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(coord, this.camera);
    const pos = new THREE.Vector3(0, 1, 0);
    raycaster.ray.intersectPlane(this.graphPlane, pos);
    pos.multiply(this.rangeTransform);
    pos.z = 1 - pos.z;
    return pos;
  }

  /** Mouse event -> (m/z, rt); -1 for a coordinate outside the view. */
  getMzRt(event: MouseEvent): [number, number] {
    const p = this.getMousePosition(event);
    let mz = p.x * this.viewRange.mzrange + this.viewRange.mzmin;
    let rt = p.z * this.viewRange.rtrange + this.viewRange.rtmin;
    mz = (mz < this.viewRange.mzmin || mz > this.viewRange.mzmax) ? -1 : parseFloat(mz.toFixed(3));
    rt = (rt < this.viewRange.rtmin || rt > this.viewRange.rtmax) ? -1 : parseFloat(rt.toFixed(3));
    return [mz, rt];
  }

  /** Nearest MS1 scan (by RT, within 1% of the RT range) or null. */
  findNearestScan(rt: number): ScanRow | null {
    const threshold = this.viewRange.rtrange / 100;
    let best: ScanRow | null = null;
    let bestDiff = threshold;
    for (const s of this.scans) {
      const diff = Math.abs(s.rt - rt);
      if (diff < bestDiff) { bestDiff = diff; best = s; }
    }
    return best;
  }

  /* ------------------------------------------------------------ intensity scaling */
  scaleInteToWorldUnit(inte: number): number {
    const d = this.dataRange;
    return ((inte - d.intmin) / (d.intmax - d.intmin)) * Ms1Graph.gridRange;
  }

  scaleWorldUnitToInte(worldUnit: number): number {
    const d = this.dataRange;
    return (worldUnit / Ms1Graph.gridRange) * (d.intmax - d.intmin) + d.intmin;
  }

  /** Vertical scale of the data group: shrink tall regions, boost regions of weak peaks. */
  calcIntScale(): number {
    let intScale = this.intSquish;
    const maxInt = this.viewRange.intmax;
    const scaledMaxInt = this.scaleInteToWorldUnit(maxInt);
    if (!this.autoScaleIntensity) return intScale;
    if (!this.isPan) {
      const ratio = maxInt / this.intensitySumTotal;
      if (ratio < Ms1Graph.lowInteThreshold) {
        intScale = (Ms1Graph.minPeakHeight * Ms1Graph.lowInteScaleFactor) / scaledMaxInt;
      } else {
        intScale = 1;
      }
      if (scaledMaxInt * intScale > Ms1Graph.maxPeakHeight) {
        intScale = Ms1Graph.maxPeakHeight / scaledMaxInt;
      }
    }
    return intScale;
  }

  /** After a manual intensity zoom-in: let boosted low peaks fall back to their true height. */
  adjustIntensity(): void {
    const yScale = this.plotGroup.scale.y * this.dataGroup.scale.y;
    this.plotGroup.children.forEach((obj) => {
      const peak = obj as PeakLine;
      if (!peak.visible || !peak.lowPeak) return;
      const pos = peak.geometry.attributes.position as THREE.BufferAttribute;
      if (peak.int * yScale < Ms1Graph.minPeakHeight) {
        peak.height = Ms1Graph.minPeakHeight / yScale;
      } else {
        peak.height = peak.int;
        peak.lowPeak = false;
      }
      pos.setY(1, peak.height);
      pos.needsUpdate = true;
    });
  }

  /* ------------------------------------------------------------ ticks and labels */
  static makeTextSprite(msg: string, fontsize: number): THREE.Sprite {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return new THREE.Sprite();
    context.font = fontsize + 'px Arial';
    const width = context.measureText(msg).width;
    context.fillStyle = 'rgba(0, 0, 0, 1.0)';
    context.fillText(msg, canvas.width / 2 - width / 2, canvas.height / 2 - fontsize / 2);
    const texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;
    texture.minFilter = THREE.LinearFilter;
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture }));
    sprite.scale.set(0.5 * fontsize, 0.25 * fontsize, 0.75 * fontsize);
    return sprite;
  }

  static roundTo(n: number, places: number): number {
    const p = Math.pow(10, places);
    return Math.round(n * p) / p;
  }

  private static pickTick(list: number[], span: number, num: number): number {
    for (let i = 0; i < list.length - 1; i++) {
      if (span / num <= list[i] && span / num > list[i + 1]) return list[i];
    }
    return list[list.length - 1];
  }

  private static disposeAll(group: THREE.Group): void {
    while (group.children.length > 0) {
      const obj = group.children.pop() as any;
      if (obj.material?.map) obj.material.map.dispose();
      if (obj.material) obj.material.dispose();
      if (obj.geometry) obj.geometry.dispose();
    }
  }

  private makeTick(x1: number, z1: number, x2: number, z2: number): void {
    const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x1, 0, z1), new THREE.Vector3(x2, 0, z2)]);
    this.ticksGroup.add(new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0x000000 })));
  }

  private makeTickLabel(which: 'mz' | 'rt', mz: number, rt: number): void {
    let text: string;
    let xoffset = 0;
    let zoffset = 0;
    if (which === 'mz') {
      text = Ms1Graph.roundTo(mz, Ms1Graph.roundMz).toString();
      zoffset = 2.0;
    } else {
      text = Ms1Graph.roundTo(rt, Ms1Graph.roundRt).toString();
      xoffset = -1.5;
      zoffset = 0.2;
    }
    const label = Ms1Graph.makeTextSprite(text, 15);
    const g = this.mzRtToGridSpace(mz, rt);
    label.position.set(g.x + xoffset, 0, g.z + zoffset);
    this.tickLabelGroup.add(label);
  }

  private drawTicks(): void {
    const vr = this.viewRange;
    Ms1Graph.disposeAll(this.tickLabelGroup);
    Ms1Graph.disposeAll(this.ticksGroup);
    const tickWidth = Ms1Graph.pickTick(Ms1Graph.tickWidthList, vr.mzrange, Ms1Graph.xTickNum);
    const tickHeight = Ms1Graph.pickTick(Ms1Graph.tickHeightList, vr.rtrange, Ms1Graph.yTickNum);
    const rtlen = vr.rtrange * 0.02;
    const mzlen = vr.mzrange * 0.02;
    // m/z ticks along the near edge (rt = rtmin)
    const firstMz = Math.ceil(vr.mzmin / tickWidth) * tickWidth;
    for (let mz = firstMz; mz <= vr.mzmax + 1e-9; mz += tickWidth) {
      this.makeTick(mz, vr.rtmin, mz, vr.rtmin - rtlen);
      this.makeTickLabel('mz', mz, vr.rtmin);
    }
    // rt ticks along the left edge (mz = mzmin)
    const firstRt = Math.ceil(vr.rtmin / tickHeight) * tickHeight;
    for (let rt = firstRt; rt <= vr.rtmax + 1e-9; rt += tickHeight) {
      this.makeTick(vr.mzmin, rt, vr.mzmin - mzlen, rt);
      this.makeTickLabel('rt', vr.mzmin, rt);
    }
  }

  /**
   * Scale and place the data group so (m/z, rt) coordinates land on the
   * grid, then redraw the ticks.
   */
  repositionPlot(): void {
    const r = this.viewRange;
    const g = Ms1Graph.gridRange;
    const mzSquish = g / (r.mzmax - r.mzmin);
    const rtSquish = -g / (r.rtmax - r.rtmin);
    const intSquish = this.calcIntScale();
    this.intSquish = intSquish;
    this.isPan = false;
    this.dataGroup.scale.set(mzSquish, intSquish, rtSquish);
    this.dataGroup.position.set(-r.mzmin * mzSquish, 0, g - r.rtmin * rtSquish);
    this.markerGroup.scale.set(1, 1, rtSquish);
    this.markerGroup.position.set(0, 0, g - r.rtmin * rtSquish);
    this.drawTicks();
  }

  /* ------------------------------------------------------------ peaks */
  private getInteRange(points: PeakRow[]): void {
    let intmin = Infinity;
    let intmax = 0;
    this.intensitySum = 0;
    for (const p of points) {
      if (p.intensity < intmin) intmin = p.intensity;
      if (p.intensity > intmax) intmax = p.intensity;
      this.intensitySum += p.intensity;
    }
    this.viewRange.intmin = points.length ? intmin : 0;
    this.viewRange.intmax = intmax;
  }

  /** Log-scale color index of an intensity within [min, max] of the current data. */
  private relativeColor(inte: number, min: number, max: number): string {
    const n = Ms1Graph.peakColor.length;
    if (max <= min || inte <= 0) return Ms1Graph.peakColor[0];
    const t = (Math.log(inte) - Math.log(min)) / (Math.log(max) - Math.log(min));
    const idx = Math.floor(n * t);
    return Ms1Graph.peakColor[Math.min(n - 1, Math.max(0, idx))];
  }

  private peakColorOf(point: PeakRow, min: number, max: number): string {
    if (this.isIntensityAbsolute) {
      return Ms1Graph.peakColor[Math.min(Ms1Graph.peakColor.length - 1, Math.max(0, point.color))];
    }
    return this.relativeColor(point.intensity, min, max);
  }

  /** Place the 3D peak lines for the current data (strongest peaks first). */
  updatePeaks(data: PeakRow[]): void {
    if (this.autoScaleIntensity) {
      // reset a manual (ctrl + wheel) scale before auto scaling
      this.plotGroup.scale.set(this.plotGroup.scale.x, Ms1Graph.maxPeakHeight / this.dataRange.intmax, this.plotGroup.scale.z);
    }
    const intScale = this.calcIntScale();
    const min = data.length ? data[data.length - 1].intensity : 0;
    const max = data.length ? data[0].intensity : 0;
    const curRt = this.curRt.toFixed(4);
    const vr = this.viewRange;
    this.plotGroup.children.forEach((obj, index) => {
      const line = obj as PeakLine;
      if (index >= data.length) { line.visible = false; return; }
      const point = data[index];
      const inRange = point.mz >= vr.mzmin && point.mz <= vr.mzmax && point.rt >= vr.rtmin && point.rt <= vr.rtmax;
      if (!inRange) { line.visible = false; return; }
      let y = point.intensity;
      let lowPeak = false;
      // boost peaks that would be shorter than minPeakHeight world units
      // (the y scale of the plot and data groups turns intensity into height)
      const yScale = this.plotGroup.scale.y * intScale;
      if (y * yScale < Ms1Graph.minPeakHeight) {
        y = Ms1Graph.minPeakHeight / yScale;
        lowPeak = true;
      }
      const pos = line.geometry.attributes.position as THREE.BufferAttribute;
      pos.setY(1, y);
      pos.needsUpdate = true;
      const material = line.material as THREE.LineBasicMaterial;
      material.color.setStyle(this.peakColorOf(point, min, max));
      if (this.isHighlightingScan && point.rt.toFixed(4) === curRt) {
        material.color.setStyle(Ms1Graph.currentScanColor);
      }
      line.position.set(point.mz, 0, point.rt);
      line.mz = point.mz; line.rt = point.rt; line.int = point.intensity; line.height = y; line.lowPeak = lowPeak;
      line.visible = true;
    });
  }

  /** Top-down view: each peak is a short flat segment along RT, colored by intensity. */
  plotPoint2D(): void {
    const data = this.currentData.slice().sort((a, b) => a.rt - b.rt);
    const min = this.currentData.length ? this.currentData[this.currentData.length - 1].intensity : 0;
    const max = this.currentData.length ? this.currentData[0].intensity : 0;
    const vr = this.viewRange;
    const curRt = parseFloat(this.curRt.toFixed(4));
    let prevSpecRT = 0;
    let prevPeakRT = data.length ? data[data.length - 1].rt : 0;
    this.peak2DGroup.children.forEach((obj, index) => {
      const line = obj as PeakLine;
      if (index >= data.length) { line.visible = false; return; }
      const point = data[data.length - 1 - index];
      const inRange = point.mz >= vr.mzmin && point.mz <= vr.mzmax && point.rt >= vr.rtmin && point.rt <= vr.rtmax;
      if (!inRange) { line.visible = false; return; }
      if (point.rt !== prevPeakRT) prevSpecRT = prevPeakRT;
      let ySize = prevSpecRT - point.rt;          // gap to the next scan
      const minSize = vr.rtrange / 60;
      if (ySize < minSize) ySize = minSize;
      if (prevSpecRT === 0) ySize = vr.rtrange / 120;
      const pos = line.geometry.attributes.position as THREE.BufferAttribute;
      pos.setZ(1, ySize);
      pos.needsUpdate = true;
      const material = line.material as THREE.LineBasicMaterial;
      material.color.setStyle(this.peakColorOf(point, min, max));
      if (this.isHighlightingScan && parseFloat(point.rt.toFixed(4)) === curRt) {
        material.color.setStyle(Ms1Graph.currentScanColor);
      }
      line.position.set(point.mz, 0, point.rt);
      line.mz = point.mz; line.rt = point.rt; line.int = point.intensity;
      line.visible = true;
      prevPeakRT = point.rt;
    });
    this.dataGroup.add(this.peak2DGroup);
  }

  private drawScanMarker(): void {
    const show = this.isHighlightingScan && this.curRt >= this.viewRange.rtmin && this.curRt <= this.viewRange.rtmax;
    this.markerGroup.children.forEach((line) => {
      line.position.set(0, 0.01, this.curRt);
      line.visible = show;
    });
  }

  /** Redraw the current window with new data. */
  draw(data: PeakRow[]): void {
    this.currentData = data;
    this.getInteRange(data);
    this.drawNoNewData();
  }

  /** Redraw the current window with the data already loaded. */
  drawNoNewData(): void {
    if (this.isPerpendicular) {
      this.plotPoint2D();
    } else {
      this.updatePeaks(this.currentData);
    }
    this.drawScanMarker();
    this.repositionPlot();
    this.render();
    if (this.onData) this.onData(this.currentData, this.viewRange, this.intensitySum);
  }

  /** PNG of the current rendering. */
  toDataURL(): string {
    this.render();
    return this.renderer.domElement.toDataURL('image/png');
  }
}
