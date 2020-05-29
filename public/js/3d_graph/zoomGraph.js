//on mouse wheel event, get mouse point
//if it is near x axis, y axis, or else, adjust range accordingly
MsGraph.prototype.zoomGraph = function(graph){
    graph.renderer.domElement.addEventListener('wheel', this.onZoom.bind(this), false);
}
MsGraph.prototype.adjustPeakHeight = function(scaleFactor){
    this.linesArray = [];

    for (let i = 0; i < this.currentData.length; i++){
        this.currentData[i].INTENSITY = this.currentData[i].INTENSITY * scaleFactor;//multiply intensity by scaleFactor
        this.plotPoint(this.currentData[i]);
    }

    //this.plotJumpMarker();
    this.viewRange["intscale"] = this.viewRange["intscale"] + scaleFactor - 1;//because default value is 1, deduct 1 to start from 0.
    this.repositionPlot(this.viewRange);

    this.updateViewRange(this.viewRange);
}
MsGraph.prototype.getMousePosition = function(event) {
    var el = this.renderer.domElement;
  
  // find mouse position, normalized to a [-1,1] in both x/y-axes on screen
  var coord = {
    x: ((event.clientX - el.offsetLeft) / el.offsetWidth)  * 2 - 1,
    y: - ((event.clientY - el.offsetTop) / el.offsetHeight) * 2 + 1
  };
  //console.log("offsetleft ", el.offsetLeft, " offsetTop ", el.offsetTop, " offsetWidth ", el.offsetWidth, " offsetHeight ", el.offsetHeight);
  var raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(coord, this.camera);

  var pos = raycaster.ray.intersectPlane(this.graphPlane);
  if (pos) {
    // convert world coordinates to graph-fractional coordinates
    pos.multiply(this.rangeTransform);
    pos.z = 1 - pos.z;
  }
  return pos;
};
MsGraph.prototype.onZoom = function(e){
    let mousePos = this.getMousePosition(e);
    let scaleFactor = 0;

    let newmzrange = this.viewRange.mzrange;
    let newrtrange = this.viewRange.rtrange;

    console.log("mouse pos: ", mousePos.x, mousePos.z);
    //reset view range based on scroll up or down
    if (e.deltaY < 0) {
        scaleFactor = 0.75;
    }
    else{
        scaleFactor = 1.5;
    }

    //figure out where the cursor is (near x axis, y axis, in the middle)
    if (mousePos.x <= 0.1 && mousePos.x >= -0.1){//rt range adjust
        newrtrange = this.viewRange.rtrange * scaleFactor;
    }
    else if (mousePos.z <= 0.1 && mousePos.z >= -0.1){//mz range adjust
        newmzrange = this.viewRange.mzrange * scaleFactor;
    }
    else if(mousePos.x > 0.1 && mousePos.x <= 1.1 && mousePos.z > 0.1 && mousePos.z <= 1.1){//intensity adjust
        this.adjustPeakHeight(scaleFactor);
        return;
    }
    //if range is too small, set to minimum range of 0.01

    if (newrtrange < 0.01){
        newrtrange = 0.01;
    }
    if (newmzrange < 0.01){
        newmzrange = 0.01;
    }
    // constrains points to within the graph bounds
    let mzDist = Math.min(Math.max(mousePos.z, 0), 1);
    let rtDist = Math.min(Math.max(mousePos.x, 0), 1);

    let mzPoint = mzDist * this.viewRange.mzrange + this.viewRange.mzmin;;
    let rtPoint = rtDist * this.viewRange.rtrange + this.viewRange.rtmin;
    let newmzmin = (mzPoint) - (newmzrange / this.viewRange.mzrange) * (mzPoint - this.viewRange.mzmin);
    let newrtmin = (rtPoint) - (newrtrange / this.viewRange.rtrange) * (rtPoint - this.viewRange.rtmin);
    
    this.setViewingArea(newmzmin, newmzrange, newrtmin, newrtrange);
}