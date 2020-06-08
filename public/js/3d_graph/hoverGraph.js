//on hover, highlught and display peak information (scan ID, intensity, rt, mz)

MsGraph.prototype.hoverGraph = function(graph){
   this.currentPeak = null;
   graph.renderer.domElement.addEventListener('mousemove', this.onMouseOver.bind(this), false);
}
/*
MsGraph.prototype.onMouseOver = function(peak){
    console.log(peak.mz, peak.rt)
    this.currentPeak = peak;
    this.currentPeak.origColor = this.currentPeak.material.color.getHex();
    document.getElementById('graph-hover-label').innerText = "scan: " + peak.scanID + ", m/z : " + peak.mz.toFixed(2) + ", intensity: " + peak.int.toFixed(2) + ", retention time: " + (peak.rt/60).toFixed(4); 
    
    peak.material.color.setHex(0xffcf00);
    peak.pinhead.material.color.setHex(0xffcf00);
    this.renderer.render(this.scene, this.camera);
    return;
}
MsGraph.prototype.onMouseOut = function(peak){
    peak.material.color.setHex( peak.origColor);
}*/

MsGraph.prototype.onMouseOver = function(event){
    let mousePos = this.getMousePosition(event);
    
    let curmz = mousePos.x * this.viewRange.mzrange + this.viewRange.mzmin;//current mz and rt that has a cursor pointed to
    let currt = mousePos.z * this.viewRange.rtrange + this.viewRange.rtmin;

    if (this.currentPeak != null){//restore orig color for the peak that was highlighted previously
        this.currentPeak.material.color.setHex( this.currentPeak.origColor);
        this.currentPeak.pinhead.material.color.setHex(this.currentPeak.origColor);
    }

    let closestD = Infinity;
    let closestPeak = null;

    for (let i = 0; i < this.linesArray.length; i++){//search through this.lineArray to find closest peak to the mouse cursor
        if (Math.abs(this.linesArray[i].mz - curmz) < 0.01 || Math.abs(this.linesArray[i].rt - currt) < 0.01){
            let mzD = Math.abs(this.linesArray[i].mz - curmz);
            let rtD = Math.abs(this.linesArray[i].rt - currt);
            let dist = Math.sqrt(mzD * mzD + rtD * rtD);
            if (dist < closestD){
                closestD = dist;
                closestPeak = this.linesArray[i];
            }
        }
    }
    if (closestPeak != null){//if a peak is under the cursor, highlight and display its information
       // console.log(curmz, currt)
        this.currentPeak = closestPeak;
        this.currentPeak.origColor = this.currentPeak.material.color.getHex();
        document.getElementById('graph-hover-label').innerText = "scan: " + closestPeak.scanID + ", m/z : " + closestPeak.mz.toFixed(2) + ", intensity: " + closestPeak.int.toFixed(2) + ", retention time: " + (closestPeak.rt/60).toFixed(4); 
        closestPeak.material.color.setHex(0xffcf00);
        closestPeak.pinhead.material.color.setHex(0xffcf00);
        this.renderer.render(this.scene, this.camera);
    }
}
