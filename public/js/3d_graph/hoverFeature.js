//on hover, highlught and display feature information (scan ID, intensity, rt, mz)

MsGraph.prototype.hoverGraph = function(graph){
   this.currentFeature = null;
   graph.renderer.domElement.addEventListener('mousemove', this.onMouseOver.bind(this), false);
}

MsGraph.prototype.onMouseOver = function(event){
    let mousePos = this.getMousePosition(event);
    
    let curmz = mousePos.x * this.viewRange.mzrange + this.viewRange.mzmin;//current mz and rt that has a cursor pointed to
    let currt = mousePos.z * this.viewRange.rtrange + this.viewRange.rtmin;
    console.log("mz, rt: ", curmz, currt);
    /*
    if (this.currentFeature != null){//restore orig color for the peak that was highlighted previously
        this.currentPeak.material.color.setHex( this.currentPeak.origColor);
        this.currentPeak.pinhead.material.color.setHex(this.currentPeak.origColor);
    }*/
    let closestD = Infinity;
    let closestFeature = null;
    
    let featureArray = this.featuregroup.children;
    console.log("featureArray", featureArray);

    for (let i = 0; i < this.featureArray.length; i++){//search through this.lineArray to find closest peak to the mouse cursor
        if (Math.abs(this.featureArray[i].mz - curmz) < 0.01 || Math.abs(this.featureArray[i].rt - currt) < 0.01){
            let mzD = Math.abs(this.featureArray[i].mz - curmz);
            let rtD = Math.abs(this.featureArray[i].rt - currt);
            let dist = Math.sqrt(mzD * mzD + rtD * rtD);
            if (dist < closestD){
                closestD = dist;
                closestPeak = this.featureArray[i];
            }
        }
    }
    if (closestPeak != null){//if a peak is under the cursor, highlight and display its information
        this.currentPeak = closestPeak;
        //this.currentPeak.origColor = this.currentPeak.material.color.getHex();
        document.getElementById('graph-hover-label').innerText = "scan: " + closestPeak.scanID + ", m/z : " + closestPeak.mz.toFixed(2) + ", intensity: " + closestPeak.int.toFixed(2) + ", retention time: " + (closestPeak.rt/60).toFixed(4); 
        //closestPeak.material.color.setHex(0xffcf00);
        //closestPeak.pinhead.material.color.setHex(0xffcf00);
        this.renderer.render(this.scene, this.camera);
    }
}
