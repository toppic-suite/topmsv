//on click and drag, move the peaks based on the rt mz range

MsGraph.prototype.panGraph = function(graph){
    this.mstart = null;
    this.mend = new THREE.Vector3();
    this.mdelta = new THREE.Vector3();

    graph.renderer.domElement.addEventListener('mousedown', this.onMouseDown.bind(this), false);
    //graph.renderer.domElement.addEventListener('mousemove', this.onMousemove.bind(this), false);
    graph.renderer.domElement.addEventListener('mouseup', this.onMouseUp.bind(this), false);
}
MsGraph.prototype.panView = function(x,z){
    let viewRange = this.viewRange;
    let mzmin = viewRange.mzmin + (x * viewRange.mzrange);
    let rtmin = viewRange.rtmin + (z * viewRange.rtrange);

    if (mzmin < 0){
      mzmin = 0;
    }
    if (rtmin < 0){
      rtmin = 0;
    }

    this.setViewingArea(mzmin, viewRange.mzrange, rtmin, viewRange.rtrange);
}
MsGraph.prototype.onMouseDown = function(e){
    if (e.button === 0) {
        let mousePoint = this.getMousePosition(e);
        if (mousePoint === null) {
          return;
        }
        this.mstart = new THREE.Vector3();
        this.mstart.copy(mousePoint);
      }
}
MsGraph.prototype.onMouseUp = function(e) {
  let mousePoint = this.getMousePosition(e);
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