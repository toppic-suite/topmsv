// graphpoints.js : draws and manages the points on the screen and panning/zooming

MsGraph.setOnTop = function(obj) {
    obj.renderOrder = 10;
    obj.onBeforeRender = function(r) { r.clearDepth() };
}
MsGraph.prototype.clearGraph = function() {
    this.linesArray = [];
    this.plotGroup.children = [];
    this.markergroup.children = [];
}
MsGraph.prototype.displayGraphData = function(){
    //display highest intensity, sum of intensity, total peak count in the current grph
    let highestInte = "Highest Intensity: " + this.dataRange.intmax;
    let sumInte = "Sum of Intensity: " + this.intensitySum;
    let peakCount = "Total Peaks on Graph: " + this.currentData.length;
    let sep = "\n";
    document.getElementById('graph-metadata').innerText = highestInte + sep + sumInte + sep + peakCount + sep;
}
MsGraph.prototype.getInteRange = function(points){
    let intmin = Infinity;
    let intmax = 0;
    this.intensitySum = 0;
    for (let i = 0; i < points.length; i++){
        if (points[i].INTENSITY < intmin){
            intmin = points[i].INTENSITY;
        }
        if(points[i].INTENSITY > intmax){
            intmax = points[i].INTENSITY;
        }
        this.intensitySum = this.intensitySum + points[i].INTENSITY;
    }
    this.dataRange.intmin = intmin;
    this.dataRange.intmax = intmax;
    this.dataRange.intrange = intmax - intmin;
}
MsGraph.prototype.drawGraph = function(minmz, maxmz, minrt, maxrt, rt){//draw based on ms1 graph mz range
    this.clearGraph();

    this.dataRange.mzmin = minmz;
    this.dataRange.mzmax = maxmz;
    this.dataRange.mzrange = maxmz - minmz;

    this.dataRange.rtmin = minrt;
    this.dataRange.rtmax = maxrt;
    this.dataRange.rtrange = maxrt - minrt;
    
    this.getInteRange(this.currentData);
    this.setGradientInterval();

    for (let i = 0; i < this.currentData.length; i++)
    {   
        this.plotPoint(this.currentData[i]);
    }
    this.viewRange["intscale"] = 1;

    // make sure the groups are plotted and update the view
    
    if (rt <= maxrt && rt >= minrt){
        this.drawCurrentScanMarker(rt);
    }
    this.displayGraphData();//display metadata about the graph
    this.updateViewRange(this.dataRange);
}
MsGraph.prototype.drawCurrentScanMarker = function(rt){
    //draw a red line horizontal to x axis where y = current scan retention time
    var linegeo = new THREE.Geometry();
        
    linegeo.vertices.push(new THREE.Vector3(0, 0.1, 0));
    linegeo.vertices.push(new THREE.Vector3(this.GRID_RANGE, 0.1, 0));

    var linemat = new THREE.LineBasicMaterial({color: 0xED1111});

    var marker = new THREE.Line(linegeo, linemat);
    marker.name = "currentScanMarker";

    this.markergroup.add(marker);
    
    marker.position.set(0, 0, rt);
}
MsGraph.prototype.addNewScanDataToGraph = function(points, ms1Peaks, minmz, maxmz, minrt, maxrt){
    let peakCount = ms1Peaks.length;

    let peaksToAdd = points.splice(0, Math.min(this.maxPeaks - peakCount, points.length));
    this.currentData = ms1Peaks.concat(peaksToAdd);
}
MsGraph.prototype.setGradientInterval = function(){
    //pick peak color based on each peak intensity -- currently 5 levels gradient
    this.cutoff = [];//cutoff point for intensity for each color
    let interval = this.dataRange.intrange / this.gradientColor.length; 

    for (let i = 1; i <= this.gradientColor.length; i++){
        let val = this.dataRange.rtmin + (interval * i);
        this.cutoff.push(val);
    } 
}
MsGraph.prototype.pickPeakColor = function(intensity){
    for (let j = 0; j < this.cutoff.length; j++){
        if (intensity <= this.cutoff[j]){
            return this.gradientColor[j];
        }
    }
    return this.gradientColor[this.gradientColor.length - 1];
}
MsGraph.prototype.plotPointAsCircle = function(){
    
    let mzRange = this.dataRange.mzmax - this.dataRange.mzmin;
    let rtRange = (this.dataRange.rtmax - this.dataRange.rtmin)/60;

    let xSize = mzRange / 100;
    let ySize = rtRange;

    //called from renderImmediate when view is perpendicular
    let scanID = document.getElementById('scanID1').innerText;
    let rt = document.getElementById("scan1RT").innerText;

    let prevGroup = this.datagroup.getObjectByName("cylinderGroup");

    if (prevGroup == undefined){
        this.cylinderGroup = new THREE.Group();//when view angle is perpendicular
        this.cylinderGroup.name = "cylinderGroup";
        this.datagroup.add(this.cylinderGroup);
    }
    else{
        this.cylinderGroup = prevGroup;
    }

    for (let i = 0; i < this.currentData.length; i++)
    {   
        var point = this.currentData[i];
        var lineColor = this.pickPeakColor(this.currentData[i].INTENSITY);
        console.log(lineColor)
        //var geometry = new THREE.CylinderBufferGeometry(xSize, ySize, 1, 0);
        var geometry = new THREE.BoxBufferGeometry( xSize, 1, ySize );
        var material = new THREE.MeshBasicMaterial( { color: lineColor } );
   
        if ((point.RETENTIONTIME/60).toFixed(4) == rt){
            material = new THREE.MeshBasicMaterial({color: 0xED1111});
        }
        var circle = new THREE.Mesh( geometry, material );

        circle.position.set(point.MZ, 0, point.RETENTIONTIME);

        circle.pointid = point.ID;
        circle.mz = point.MZ;
        circle.rt = point.RETENTIONTIME;
        circle.int = point.INTENSITY;
        circle.height = 10;
        circle.name = "point";
        circle.scanID = point.SPECTRAID;
        this.cylinderGroup.add(circle);
    }
    //repositioning m/z and rt from repositionPlot
    var heightScale = this.USE_LOG_SCALE_HEIGHT ? Math.log(this.dataRange.intmax) : this.dataRange.intmax;
    var mz_squish = this.GRID_RANGE / this.dataRange.mzrange;
    var rt_squish = - this.GRID_RANGE / this.dataRange.rtrange;
    var inte_squish = (this.GRID_RANGE_VERTICAL / heightScale) * this.dataRange.intscale;

    if (this.dataRange.intmax < 1){
        //there is a problem when there is no peak --> this.dataRange.intmax becomes 0 and inte_squish is a result of dividing by zero
        inte_squish = 0;
    }
    // Reposition the plot so that mzmin,rtmin is at the correct corner
    this.datagroup.position.set(-this.dataRange.mzmin*mz_squish, inte_squish, this.GRID_RANGE - this.dataRange.rtmin*rt_squish);
}
// plots a single point on the graph
MsGraph.prototype.plotPoint = function(point) {
    // point: an array of the following values
    var id = point.ID;
    var mz = point.MZ;
    var rt = point.RETENTIONTIME;
    var inten = point.INTENSITY;
    var lineColor = this.pickPeakColor(inten);
   
    var thisLogScale = this.LOG_SCALAR * Math.log(inten);
    var maxLogScale = Math.log(this.dataRange.intmax);

    let scanID = document.getElementById('scanID1').innerText;
    let currt = document.getElementById("scan1RT").innerText;

    var y = this.USE_LOG_SCALE_HEIGHT ? Math.min(thisLogScale, maxLogScale) : inten;
    
    var drawObj;

    var linegeo = new THREE.BufferGeometry();
    linegeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array([
        0, 0, 0,
        0, y, 0,
    ]), 3));

    var linemat = new THREE.LineBasicMaterial({color: lineColor});

    if ((point.RETENTIONTIME/60).toFixed(4) == currt){
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
    this.markergroup.scale.set(1,1,rt_squish);

    // Reposition the plot so that mzmin,rtmin is at the correct corner
    this.datagroup.position.set(-r.mzmin*mz_squish, 0, this.GRID_RANGE - r.rtmin*rt_squish);
    this.markergroup.position.set(0, 0, this.GRID_RANGE - r.rtmin*rt_squish);

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