//on click and drag, move the peaks based on the rt mz range
class GraphPan{
  constructor(){
    this.mstart = null;
    this.mend = new THREE.Vector3();
    this.mdelta = new THREE.Vector3();
  }

  panView(x,z){
    let viewRange = Graph.viewRange;
    let mzmin = viewRange.mzmin + (x * viewRange.mzrange);
    let rtmin = viewRange.rtmin + (z * viewRange.rtrange);

    if (mzmin < 0){
      mzmin = 0;
    }
    if (rtmin < 0){
      rtmin = 0;
    }
    GraphControl.setViewingArea(mzmin, viewRange.mzrange, rtmin, viewRange.rtrange);
    load3dDataByParaRange(mzmin,mzmin + viewRange.mzrange, rtmin, rtmin + viewRange.rtrange, rawRT, true);
  }
  onMouseDown(e){
    if (e.button === 0) {
        let mousePoint = GraphUtil.getMousePosition(e);
        if (mousePoint === null) {
          return;
        }
        this.mstart = new THREE.Vector3();
        this.mstart.copy(mousePoint);
      }
  }
  onMouseUp(e) {
    let mousePoint = GraphUtil.getMousePosition(e);
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
  }
  init(){
    Graph.renderer.domElement.addEventListener('mousedown', this.onMouseDown.bind(this), false);
    Graph.renderer.domElement.addEventListener('mouseup', this.onMouseUp.bind(this), false);
  }
}


