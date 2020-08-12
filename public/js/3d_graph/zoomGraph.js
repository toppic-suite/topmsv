//on mouse wheel event, get mouse point
//if it is near x axis, y axis, or else, adjust range accordingly

let IsScrolling = false;

MsGraph.prototype.zoomGraph = function(graph){
    graph.renderer.domElement.addEventListener('wheel', this.onZoom.bind(this), false);
}
MsGraph.prototype.adjustPeakHeight = function(scaleFactor){
    let peaks = this.scene.getObjectByName("plotGroup");
    let oriScale = peaks.scale.y;

    peaks.scale.set(1, oriScale * scaleFactor, 1);
    
    this.renderImmediate();
}
MsGraph.prototype.onZoomFromEventListener = function(e, axisName){
    //zoom action detected by event listener in each axis
    let scaleFactor = 0;
    let mousePos = this.getMousePosition(e);

    let newmzrange = this.viewRange.mzrange;
    let newrtrange = this.viewRange.rtrange;

    let curmz = mousePos.x * this.viewRange.mzrange + this.viewRange.mzmin;//current mz and rt that has a cursor pointed to
    let currt = mousePos.z * this.viewRange.rtrange + this.viewRange.rtmin;

    //reset view range based on scroll up or down
    if (e.deltaY < 0) {
        scaleFactor = 0.8;
    }
    else{
        scaleFactor = 1.2;
    }
    //figure out where the cursor is (near x axis, y axis)
    if (axisName == "rt"){
        newrtrange = this.viewRange.rtrange * scaleFactor;
    }
    else if (axisName == "mz"){//mz range adjust
        newmzrange = this.viewRange.mzrange * scaleFactor;
    }
    else if (axisName == "both"){//if adjusting both
        newrtrange = this.viewRange.rtrange * scaleFactor;
        newmzrange = this.viewRange.mzrange * scaleFactor;
    }

    //if range is too small, set to minimum range of 0.01
    if (newrtrange < 0.01){
        newrtrange = 0.01;
    }
    if (newmzrange < 0.01){
        newmzrange = 0.01;
    }
    let mzscale = (curmz - this.viewRange.mzmin)/(this.viewRange.mzmax - this.viewRange.mzmin);//find relative pos of current mz currrent rt
    let rtscale = (currt - this.viewRange.rtmin)/(this.viewRange.rtmax - this.viewRange.rtmin);

    let newmzmin = curmz - (mzscale * newmzrange);//the closer curmz or currt is to the minmz and minrt, the less change in min value
    let newrtmin = currt - (rtscale * newrtrange);

    //if value goes below zero in rt or mz, set to 0
    if (newmzmin < 0){
        newmzmin = 0;
    }
    if (newrtmin < 0){
        newrtmin = 0;
    }
    //if max value is going to go over the max mz, rt, set them to be the max value, no going over the limit
    if (newmzmin + newmzrange > this.totalMaxMz){
        newmzrange = this.totalMaxMz - newmzmin;
    }
    if (newrtmin + newrtrange > this.totalMaxRt){
        newrtrange = this.totalMaxRt - newrtmin;
    }
    this.setViewingArea(newmzmin, newmzrange, newrtmin, newrtrange);
}

MsGraph.prototype.getMousePosition = function(event) {
    var el = this.renderer.domElement;
    let canvasPosition = this.renderer.domElement.getBoundingClientRect();

    //find mouse position, normalized to a [-1,1] in both x/y-axes on screen
    var coord = {
        x: ((event.clientX  - canvasPosition.left) / el.offsetWidth)  * 2 - 1,
        y: - ((event.clientY  - canvasPosition.top) / el.offsetHeight) * 2 + 1
    };
    var raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(coord, this.resizedCamera);

    var pos = raycaster.ray.intersectPlane(this.graphPlane);
    if (pos) {
    //convert world coordinates to graph-fractional coordinates
        pos.multiply(this.rangeTransform);
        pos.z = 1 - pos.z;
    }
    return pos;
};
MsGraph.prototype.onZoom = function(e){
    e.preventDefault();//disable scroll of browser

    if (this.mzAxisZoom){
        this.onZoomFromEventListener(e, "mz");
    }
    else if(this.rtAxisZoom){
        this.onZoomFromEventListener(e, "rt");
    }
    else{
        if (e.ctrlKey){//if control key is pressed --> intensity zoom
            let scaleFactor = 0;
            if (e.deltaY > 0) {
                scaleFactor = 0.75;
                this.adjustPeakHeight(scaleFactor);
            }
            else if (e.deltaY < 0){
                scaleFactor = 1.5;
                this.adjustPeakHeight(scaleFactor);
            }
        }
        else{
            this.onZoomFromEventListener(e, "both");
        }
    }
}
