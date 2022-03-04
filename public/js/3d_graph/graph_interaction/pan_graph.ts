/*pan_graph.js: on click and drag, move the peaks based on the rt mz range*/
import {Graph} from '../graph_init/graph.js';
import {GraphData} from '../graph_data/graph_data.js';
import {GraphUtil} from '../graph_util/graph_util.js';
import {GraphControl} from '../graph_control/graph_control.js';
import {Vector3} from '../../../lib/js/three.module.js';

export class GraphPan{
  mouseDown: boolean;
  mstart: Vector3 | null;
  mend: Vector3;
  mdelta: Vector3;

  constructor() {
    this.mouseDown = false;
    this.mstart = null;
    this.mend = new Vector3();
    this.mdelta = new Vector3();
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
      let mousePoint: Vector3 = GraphUtil.getMousePosition(e);
      if (mousePoint === null) {
        return;
      }
      this.mstart = new Vector3();
      this.mstart!.copy(mousePoint);//can't be null
    }
  }


  onMouseMove = (e: MouseEvent): void => {
    let mousePoint: Vector3 = GraphUtil.getMousePosition(e);
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
    let mousePoint: Vector3 = GraphUtil.getMousePosition(e);
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


