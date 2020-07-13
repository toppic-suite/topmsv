// graphpoints.js : draws and manages the points on the screen and panning/zooming

MsGraph.setOnTop = function(obj) {
    obj.renderOrder = 10;
    obj.onBeforeRender = function(r) { r.clearDepth() };
}
MsGraph.prototype.clearGraph = function() {
    this.linesArray = [];
    this.plotGroup.children = [];
}
MsGraph.prototype.getInteRange = function(points){
    let intmin = Infinity;
    let intmax = 0;

    for (let i = 0; i < points.length; i++){
        if (points[i].INTENSITY < intmin){
            intmin = points[i].INTENSITY;
        }
        if(points[i].INTENSITY > intmax){
            intmax = points[i].INTENSITY;
        }
    }
    this.dataRange.intmin = intmin;
    this.dataRange.intmax = intmax;
}

MsGraph.prototype.getInteRtRange = function(points){
    let rtmin = Infinity;
    let rtmax = 0;
    let intmin = Infinity;
    let intmax = 0;

    for (let i = 0; i < points.length; i++){
        if (points[i].RETENTIONTIME < rtmin){
            rtmin = points[i].RETENTIONTIME;
        }
        else if(points[i].RETENTIONTIME > rtmax){
            rtmax = points[i].RETENTIONTIME;
        };
        if (points[i].INTENSITY < intmin){
            intmin = points[i].INTENSITY;
        }
        else if(points[i].INTENSITY > intmax){
            intmax = points[i].INTENSITY;
        }
    }
    this.dataRange.rtmin = rtmin;
    this.dataRange.rtmax = rtmax;
    this.dataRange.rtrange = rtmax - rtmin;

    this.dataRange.intmin = intmin;
    this.dataRange.intmax = intmax;
}
MsGraph.prototype.drawGraph = function(minmz, maxmz, minrt, maxrt){//draw based on ms1 graph mz range
    this.clearGraph();

    this.dataRange.mzmin = minmz;
    this.dataRange.mzmax = maxmz;
    this.dataRange.mzrange = maxmz - minmz;

    this.dataRange.rtmin = minrt;
    this.dataRange.rtmax = maxrt;
    this.dataRange.rtrange = maxrt - minrt;

    this.getInteRange(this.currentData);

    for (let i = 0; i < this.currentData.length; i++)
    {
        this.plotPoint(this.currentData[i]);
    }
    this.viewRange["intscale"] = 1;

    // make sure the groups are plotted and update the view
    //this.repositionPlot(this.dataRange);
    this.updateViewRange(this.dataRange);
}
/*this.maxPeaks is the max number of peaks on the graph. 
    as ms1 peaks are always going to show in 3d grahph, add only a subset of peaks to the this.currentData
    which contains peaks to be drawn on the graph*/
MsGraph.prototype.addDataToGraph = function(points, minmz, maxmz, minrt, maxrt){
    let peakCount = this.ms1Peaks.length;
    let curMs1Peaks = [];
    //from ms1 data, extract only those that are in current mz and rt range
    for (let i = 0; i < peakCount && i < this.maxPeaks; i++){
        if (this.ms1Peaks[i].MZ >= minmz && this.ms1Peaks[i].MZ <= maxmz && this.ms1Peaks[i].RETENTIONTIME >= minrt && this.ms1Peaks[i].RETENTIONTIME <= maxrt)
        {
            curMs1Peaks.push(this.ms1Peaks[i]);
        }
    }
    let peaksToAdd = points.splice(0, Math.min(this.maxPeaks - curMs1Peaks.length, points.length));
    this.currentData = curMs1Peaks.concat(peaksToAdd);//store loaded data
}
MsGraph.prototype.addNewScanDataToGraph = function(points, ms1Peaks, minmz, maxmz, minrt, maxrt){
    this.ms1Peaks = ms1Peaks;//store peak 1 data
    let peakCount = ms1Peaks.length;
    let curMs1Peaks = [];

    //from ms1 data, extract only those that are in current mz and rt range
    for (let i = 0; i < peakCount && i < this.maxPeaks; i++){
        if (this.ms1Peaks[i].MZ >= minmz && this.ms1Peaks[i].MZ <= maxmz && this.ms1Peaks[i].RETENTIONTIME >= minrt && this.ms1Peaks[i].RETENTIONTIME <= maxrt)
        {
            curMs1Peaks.push(this.ms1Peaks[i]);
        }
    }
    let peaksToAdd = points.splice(0, Math.min(this.maxPeaks - curMs1Peaks.length, points.length));
    this.currentData = curMs1Peaks.concat(peaksToAdd);
}
// plots a single point on the graph
MsGraph.prototype.plotPoint = function(point) {
    // point: an array of the following values
    var id = point.ID;
    var mz = point.MZ;
    var rt = point.RETENTIONTIME;
    var inten = point.INTENSITY;
    
    var thisLogScale = this.LOG_SCALAR * Math.log(inten);
    var maxLogScale = Math.log(this.dataRange.intmax);

    let scanID = document.getElementById('scanID1').innerText;

    var x = mz;
    var y = this.USE_LOG_SCALE_HEIGHT ? Math.min(thisLogScale, maxLogScale) : inten;
    var z = rt;
    
    var drawObj;

    var meshmat = new THREE.MeshBasicMaterial({color: 0x350fa8});

    var linegeo = new THREE.BufferGeometry();
    linegeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array([
        0, 0, 0,
        0, y, 0,
    ]), 3));

    var linemat = new THREE.LineBasicMaterial({color: 0x350fa8});

    if (point.SPECTRAID == parseInt(scanID)){
        linemat = new THREE.LineBasicMaterial({color: 0xED1111});
        meshmat = new THREE.MeshBasicMaterial({color: 0xED1111});
    }
    var line = new THREE.Line(linegeo, linemat);
    line.position.set(mz, 0, rt);

    drawObj = line;
    
    drawObj.pointid = id;
    drawObj.mz = mz;
    drawObj.rt = rt;
    drawObj.int = inten;
    drawObj.height = y;
    drawObj.name = "peak";
    drawObj.scanID = point.SPECTRAID;

    this.linesArray.push(drawObj);
    this.plotGroup.add(drawObj);
};
// scales and positions the plot depending on the new viewing range
MsGraph.prototype.repositionPlot = function(r) {
    // set plot positions and scales
    var heightScale = this.USE_LOG_SCALE_HEIGHT ? Math.log(this.dataRange.intmax) : this.dataRange.intmax;
    // This step allows points to be plotted at their normal mz,rt locations in plotPoint,
    // but keeping them in the grid. Scaling datagroup transforms the coordinate system
    // from mz,rt to GRID_RANGE. RT is also mirrored because the axis runs in the "wrong" direction.
    var mz_squish = this.GRID_RANGE / r.mzrange;
    var rt_squish = - this.GRID_RANGE / r.rtrange;
    var inte_squish = (this.GRID_RANGE_VERTICAL / heightScale) * r.intscale;

    if (this.dataRange.intmax < 1){
        //there is a problem when there is no peak --> this.dataRange.intmax becomes 0 and inte_squish is a result of dividing by zero
        inte_squish = 0;
    }
    this.datagroup.scale.set(mz_squish, inte_squish, rt_squish);
    
    // Reposition the plot so that mzmin,rtmin is at the correct corner
    this.datagroup.position.set(-r.mzmin*mz_squish, 0, this.GRID_RANGE - r.rtmin*rt_squish);
    // update tick marks
    var self = this;
    MsGraph.emptyGroup(self.ticklabelgroup);
    var markMaterial = new THREE.LineBasicMaterial({ color: 0x000000});
    // draws a tick mark at the given location
    var makeTickMark = function(mzmin, mzmax, rtmin, rtmax) {
        var markGeo = new THREE.Geometry();
        markGeo.vertices.push(new THREE.Vector3(mzmin, 0, rtmin));
        markGeo.vertices.push(new THREE.Vector3(mzmax, 0, rtmax));
        var markLine = new THREE.Line(markGeo, markMaterial);
        self.ticksGroup.add(markLine);
    };

    // draws a tick label for the given location
    var makeTickLabel = function(which, mz, rt) {
        var text;
        var xoffset = 0;
        var zoffset = 0;
        if (which == "mz") {
            text = MsGraph.roundTo(mz, self.ROUND_MZ);
            zoffset = 2.0;
        } else if (which == "rt") {
            text = MsGraph.roundTo(rt/60, self.ROUND_RT);
            xoffset = -1.5;
            zoffset = 0.2;
        }

        var label = MsGraph.makeTextSprite(text, {r:0, g:0, b:0}, 15);
        var gridsp = self.mzRtToGridSpace(mz, rt);
        label.position.set(gridsp.x + xoffset, 0, gridsp.z + zoffset);
        self.ticklabelgroup.add(label);
    };

    // calculate tick frequency
    var mzSpacing = Math.pow(10, Math.floor(Math.log(r.mzrange)/Math.log(10) - 0.5));
    var rtSpacing = Math.pow(10, Math.floor(Math.log(r.rtrange)/Math.log(10) - 0.5));

    MsGraph.emptyGroup(self.ticksGroup);

    // properly check if floating-point "value" is a multiple
    // of "divisor" within a tolerance
    var isMultiple = function(value, divisor) {
        var rem = Math.abs(value % divisor);
        return (rem < 1e-4) || (divisor-rem < 1e-4);
    };

    // place mz marks...
    var mz, rt, long;

    var mzFirst = r.mzmin - (r.mzmin % mzSpacing);
    rt = r.rtmin;
    for (mz = mzFirst + mzSpacing; mz < r.mzmax; mz += mzSpacing) {
        // This little gem makes it so that tick marks that are a multiple
        // of (10 * the spacing value) are longer than the others
        long = isMultiple(mz, mzSpacing * 10);
        var rtlen = r.rtrange * (long ? 0.05 : 0.02);
        makeTickMark(mz, mz, rt, rt - rtlen);

        if (long) {
            makeTickLabel("mz", mz, rt);
        }
    }
    
    // ...and rt marks
    var rtFirst = r.rtmin - (r.rtmin % rtSpacing);
    mz = r.mzmin;
    for (rt = rtFirst + rtSpacing; rt < r.rtmax; rt += rtSpacing) {
        long = isMultiple(rt, rtSpacing * 10);
        var mzlen = r.mzrange * (long ? 0.05 : 0.02);
        makeTickMark(mz, mz - mzlen, rt, rt);

        if (long) {
            makeTickLabel("rt", mz, rt);
        }
    }
};