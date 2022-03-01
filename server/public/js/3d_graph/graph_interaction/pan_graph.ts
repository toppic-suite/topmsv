/*pan_graph.js: on click and drag, move the peaks based on the rt mz range*/
class GraphPan{
  mouseDown: boolean;
  mstart: THREE.Vector3 | null;
  mend: THREE.Vector3;
  mdelta: THREE.Vector3;

  constructor() {
    this.mouseDown = false;
    this.mstart = null;
    this.mend = new THREE.Vector3();
    this.mdelta = new THREE.Vector3();
  }


  panView = (x: number, z: number): void => {
    Graph.isPan = true;
    let viewRange: Range3DView = Graph.viewRange;
    let mzmin: number = viewRange.mzmin + (x * viewRange.mzrange);
    let rtmin: number = viewRange.rtmin + (z * viewRange.rtrange);

    let newRange: {"mzmin": number, "mzmax": number, "rtmin": number, "rtmax": number} = GraphControl.constrainBoundsPan(mzmin, viewRange.mzrange, rtmin, viewRange.rtrange);
    GraphData.updateGraph(newRange.mzmin, newRange.mzmax, newRange.rtmin, newRange.rtmax, Graph.curRT);
  }


  panViewNoNewData = (x: number, z: number): void => {
    Graph.isPan = true;
    let viewRange: Range3DView = Graph.viewRange;
    let mzmin: number = viewRange.mzmin + (x * viewRange.mzrange);
    let rtmin: number = viewRange.rtmin + (z * viewRange.rtrange);

    let newRange: {"mzmin": number, "mzmax": number, "rtmin": number, "rtmax": number} = GraphControl.constrainBoundsPan(mzmin, viewRange.mzrange, rtmin, viewRange.rtrange);
    GraphData.updateGraphNoNewData(newRange.mzmin, newRange.mzmax, newRange.rtmin, newRange.rtmax, Graph.curRT);
  }


  onMouseDown = (e: MouseEvent): void => {
    this.mouseDown = true;
    Graph.isZoom = false;
    if (e.button === 0) {
      let mousePoint: THREE.Vector3 = GraphUtil.getMousePosition(e);
      if (mousePoint === null) {
        return;
      }
      this.mstart = new THREE.Vector3();
      this.mstart.copy(mousePoint);
    }
  }


  onMouseMove = (e: MouseEvent): void => {
    let mousePoint: THREE.Vector3 = GraphUtil.getMousePosition(e);
    if (mousePoint === null) {
      return;
    }
    if (this.mstart && this.mouseDown) {
      this.mend.copy(mousePoint);
      this.mdelta.subVectors(this.mend, this.mstart);
      
      this.panViewNoNewData(-this.mdelta.x, -this.mdelta.z);
      this.mstart.copy(this.mend);
    }
  }


  onMouseUp = (e: MouseEvent): void => {
    let mousePoint: THREE.Vector3 = GraphUtil.getMousePosition(e);
    if (mousePoint === null) {
      return;
    }
    if (this.mstart) {
      this.mend.copy(mousePoint);
      this.mdelta.subVectors(this.mend, this.mstart);
      this.panView(-this.mdelta.x, -this.mdelta.z);
      this.mstart.copy(this.mend);
    }
    this.mstart = null;
    this.mouseDown = false;
  }


  main = (): void => {
    Graph.renderer.domElement.addEventListener('mousedown', this.onMouseDown, false);
    Graph.renderer.domElement.addEventListener('mousemove', this.onMouseMove, false);
    Graph.renderer.domElement.addEventListener('mouseup', this.onMouseUp, false);
  }
}


