//on hover, display peak information (scan ID, intensity, rt, mz)

MsGraph.prototype.hoverGraph = function(graph){
    this.currentPeak = null;

    graph.renderer.domElement.addEventListener('mousemove', this.onMouseOver.bind(this), false);
    graph.renderer.domElement.addEventListener('mouseup', this.onMouseUp.bind(this), false);
}
MsGraph.prototype.panView = function(x,z){
    let viewRange = this.viewRange;
    let mzmin = viewRange.mzmin + (x * viewRange.mzrange);
    let rtmin = viewRange.rtmin + (z * viewRange.rtrange);
    this.setViewingArea(mzmin, viewRange.mzrange, rtmin, viewRange.rtrange);
}
MsGraph.prototype.onMouseOver = function(event){
   // console.log("mouseover")
    
    let raycaster = new THREE.Raycaster();
    let mousePos = this.getMousePosition(event);
    
    let curmz = mousePos.x * this.viewRange.mzrange + this.viewRange.mzmin;//current mz and rt that has a cursor pointed to
    let currt = mousePos.z * this.viewRange.rtrange + this.viewRange.rtmin;
/*
   raycaster.setFromCamera( mousePos, this.resizedCamera );
  
   if (this.currentPeak != null){
    this.currentPeak.material.color.setHex( this.currentPeak.origColor);
   }
	// calculate objects intersecting the picking ray
    var intersects = raycaster.intersectObjects( this.scene.children, true );
    for ( var i = 0; i < intersects.length; i++ ) {
        if (intersects[i].object.name == "peak"){
            let curPeak = intersects[i].object;
            
            console.log("mz", curPeak.mz , curmz)
            console.log("rt", curPeak.rt , currt)

            if (Math.abs(curPeak.mz - curmz) < 0.1 && Math.abs(curPeak.rt - currt) < 0.1){
                this.currentPeak = intersects[i].object;
                this.currentPeak.origColor = this.currentPeak.material.color.getHex();//store color before hover
    
                document.getElementById('graph-hover-label').innerText = "m/z : " + intersects[i].object.mz.toFixed(2) + ", intensity: " + intersects[i].object.int.toFixed(2) + ", retention time: " + (intersects[i].object.rt/60).toFixed(4); 
                curPeak.material.color.setHex(0xffcf00);
            }
            //break;
        }
        this.currentPeak = null;
    }*/
    //search through this.lineArray

    if (this.currentPeak != null){
    this.currentPeak.material.color.setHex( this.currentPeak.origColor);
   }

    let closestD = Infinity;
    let closestPeak = null;

    for (let i = 0; i < this.linesArray.length; i++){
        if (Math.abs(this.linesArray[i].mz - curmz) < 0.1 || Math.abs(this.linesArray[i].rt - currt) < 0.1){
            
            //console.log("mz", this.currentPeak.mz , curmz)
            //console.log("rt", this.currentPeak.rt , currt)

            let mzD = Math.abs(this.linesArray[i].mz - curmz);
            let rtD = Math.abs(this.linesArray[i].rt - currt);
            let dist = Math.sqrt(mzD * mzD + rtD * rtD);
            if (dist < closestD){
                closestD = dist;
                closestPeak = this.linesArray[i];
            }
        }
    }

    if (closestPeak != null){
        this.currentPeak = closestPeak;
        this.currentPeak.origColor = this.currentPeak.material.color.getHex();
        document.getElementById('graph-hover-label').innerText = "scan: " + closestPeak.scanID + ", m/z : " + closestPeak.mz.toFixed(2) + ", intensity: " + closestPeak.int.toFixed(2) + ", retention time: " + (closestPeak.rt/60).toFixed(4); 
        closestPeak.material.color.setHex(0xffcf00);
        this.renderer.render(this.scene, this.camera);
    }

    
/*
 console.log(this.resizedCamera)
	for ( var i = 0; i < 1; i++ ) {
        if (intersects[i].object.name == "peak"){
            this.currentPeak = intersects[i].object;
            this.currentPeak.origColor = this.currentPeak.material.color.getHex();//store color before hover
            document.getElementById('graph-hover-label').innerText = "m/z : " + intersects[i].object.mz.toFixed(2) + ", intensity: " + intersects[i].object.int.toFixed(2) + ", retention time: " + (intersects[i].object.rt/60).toFixed(4); 
            this.currentPeak.material.color.setHex(0xffcf00);
        }
        else if (this.currentPeak != null){
            //if mouse is not over a peak
            this.currentPeak.material.color.setHex( this.currentPeak.origColor);
            this.currentPeak = null;
        }
    }
     this.renderer.render(this.scene, this.resizedCamera);
     */

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