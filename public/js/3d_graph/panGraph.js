//on click and drag, move the peaks based on the rt mz range

MsGraph.prototype.panGraph = function(graph){
    this.mstart = null;
    this.mend = new THREE.Vector3();
    this.mdelta = new THREE.Vector3();

    graph.renderer.domElement.addEventListener('mousedown', this.onMouseDown.bind(this), false);
    graph.renderer.domElement.addEventListener('mousemove', this.onMousemove.bind(this), false);
    graph.renderer.domElement.addEventListener('mouseup', this.onMouseUp.bind(this), false);
}
MsGraph.prototype.panView = function(x,z){
    let viewRange = this.viewRange;
    let mzmin = viewRange.mzmin + (x * viewRange.mzrange);
    let rtmin = viewRange.rtmin + (z * viewRange.rtrange);
    this.setViewingAreaNoDataLoad(mzmin, viewRange.mzrange, rtmin, viewRange.rtrange);
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
MsGraph.prototype.onMousemove = function(e){
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
/*
    // find point closest to mouse
    let vr = this.viewRange;
    let mouseMz = mousePoint.x * vr.mzrange + vr.mzmin;
    let mouseRt = mousePoint.z * vr.rtrange + vr.rtmin;

    let closest, closestDist = Number.MAX_VALUE;
    this.linesArray.forEach(function(line) {
      let mzD = Math.abs(line.mz - mouseMz);
      let rtD = Math.abs(line.rt - mouseRt);

      // only consider points within 0.5 m/z and RT units, then go by closest distance to mouse
      if (mzD > 0.5 || rtD > 0.5) {
        return;
      }

      let dist = Math.sqrt(mzD * mzD + rtD * rtD);
      if (dist < closestDist) {
        closest = line;
        closestDist = dist;
      }
    });*/
}
MsGraph.prototype.onMouseUp = function(e) {
    if (e.button === 0) {
      this.mstart = null;
    }
    console.log("panning over")
  }