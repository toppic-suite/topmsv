//on mouse wheel event, get mouse point
//if it is near x axis, y axis, or else, adjust range accordingly
MsGraph.prototype.zoomGraph = function(graph){
    graph.renderer.domElement.addEventListener('wheel', this.onZoom.bind(this), false);
    //graph.renderer.domElement.addEventListener( 'wheel', this.onZoom.bind(this), false );
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
  //console.log("windowsize", window.innerHeight, window.innerWidth)
 // console.log("clientWidthHeight: ", this.graphEl.clientWidth, this.graphEl.clientHeight);
  //console.log("aspectRatio: ", this.renderer.getSize().width / this.renderer.getSize().height);
  // console.log("resizedCamera", this.resizedCamera)
  /*var coord = {
    x: ((event.clientX) / this.graphEl.clientWidth)  * 2 - 1,
    y: - ((event.clientY) / this.graphEl.clientHeight) * 2 + 1
  };*/
  coord = {
    x: ((event.clientX - el.offsetLeft) / el.offsetWidth)  * 2 - 1,
    y: - ((event.clientY - el.offsetTop) / el.offsetHeight) * 2 + 1
  };
  //console.log("offsetleft ", el.offsetLeft, " offsetTop ", el.offsetTop, " offsetWidth ", el.offsetWidth, " offsetHeight ", el.offsetHeight);
  var raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(coord, this.resizedCamera);

  var pos = raycaster.ray.intersectPlane(this.graphPlane);

  //console.log("pos ", pos);

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

    let curmz = mousePos.x * this.viewRange.mzrange + this.viewRange.mzmin;
    let currt = mousePos.z * this.viewRange.rtrange + this.viewRange.rtmin;

    e.preventDefault();
	//e.stopPropagation();

    //console.log("mouse pos: ", mousePos.x, mousePos.z);
   //console.log("mz and rt: ", curmz, currt/60)
    //console.log("mzmin and rtmin", this.viewRange.mzmin, " ", this.viewRange.rtmin)
    //reset view range based on scroll up or down
    if (e.deltaY < 0) {
        scaleFactor = 0.75;
    }
    else{
        scaleFactor = 1.5;
    }

    //figure out where the cursor is (near x axis, y axis, in the middle)
    if (mousePos.x < 0.1 && mousePos.x > -0.1){//rt range adjust
        //console.log("rt axis zoom")
        newrtrange = this.viewRange.rtrange * scaleFactor;
    }
    else if (mousePos.z < 0.1 && mousePos.z > -0.1){//mz range adjust
        //console.log("mz axis zoom")
        newmzrange = this.viewRange.mzrange * scaleFactor;
    }
    else if(mousePos.x > 0.1 && mousePos.x <= 1.1 && mousePos.z > 0.1 && mousePos.z <= 1.1){//intensity adjust
       // console.log("itnensity zoom")
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

    let mzscale = ((curmz - this.viewRange.mzmin)/(this.viewRange.mzmax - this.viewRange.mzmin));
    let rtscale = ((currt - this.viewRange.rtmin)/(this.viewRange.rtmax - this.viewRange.rtmin));

    let newmzmin = curmz - (mzscale * newmzrange);
    let newrtmin = currt - (rtscale * newrtrange);

    //if value goes below zero in rt or mz, set to 0
    if (newmzmin < 0){
        newmzmin = 0;
    }
    if (newrtmin < 0){
        newrtmin = 0;
    }

    this.setViewingArea(newmzmin, newmzrange, newrtmin, newrtrange);
}