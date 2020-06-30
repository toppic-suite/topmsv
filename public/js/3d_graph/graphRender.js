// graphpoints.js : draws and manages the points on the screen and panning/zooming

MsGraph.PIN_GEO = new THREE.CircleBufferGeometry(0.1, 8);
MsGraph.CYLINDER_RADIUS_MAX = 0.1;
MsGraph.CYLINDER_RADIUS_MIN = 0.065;

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
    this.updateViewRange(this.dataRange);

    console.log("at drawGraph, currentData.length : ", this.currentData.length);

    for (let i = 0; i < this.currentData.length; i++)
    {
        this.plotPoint(this.currentData[i]);
    }
    this.viewRange["intscale"] = 1;
    // make sure the groups are plotted and update the view
    this.repositionPlot(this.viewRange);
    this.updateViewRange(this.viewRange);
}
/*this.maxPeaks is the max number of peaks on the graph. 
    as ms1 peaks are always going to show in 3d grahph, add only a subset of peaks to the this.currentData
    which contains peaks to be drawn on the graph*/
MsGraph.prototype.addDataToGraph = function(points, minmz, maxmz, minrt, maxrt){
    let peakCount = this.ms1Peaks.length;
    if (peakCount >= this.maxPeaks)//if current scan has more than max peak possible
    {
        //limit peaks so that peaks stay within the max peaks count
        this.currentData = this.ms1Peaks.splice(0, this.maxPeaks - 1);
    }
    else
    {
        let curMs1Peaks = [];
        //from ms1 data, extract only those that are in current mz and rt range
        for (let i =0; i < peakCount; i++){
            if (this.ms1Peaks[i].MZ >= minmz && this.ms1Peaks[i].MZ <= maxmz && this.ms1Peaks[i].RETENTIONTIME >= minrt && this.ms1Peaks[i].RETENTIONTIME <= maxrt)
            {
                curMs1Peaks.push(this.ms1Peaks[i]);
            }
        }
        let peaksToAdd = points.splice(0, Math.min(this.maxPeaks - curMs1Peaks.length, points.length) - 1);
    
        this.currentData = curMs1Peaks.concat(peaksToAdd);//store loaded data
    }
    console.log("peakCount : ", this.currentData.length);
}
MsGraph.prototype.addNewScanDataToGraph = function(points, ms1Peaks, minmz, maxmz, minrt, maxrt){
    this.currentData = points;//store loaded data
    this.ms1Peaks = ms1Peaks;//store peak 1 data
    let peakCount = ms1Peaks.length;

    if (peakCount >= this.maxPeaks)//if current scan has more than max peak possible
    {
        //limit peaks so that peaks stay within the max peaks count
        this.currentData = this.ms1Peaks.splice(0, this.maxPeaks - 1);
    }
    else
    {
        let curMs1Peaks = [];
        //from ms1 data, extract only those that are in current mz and rt range
        for (let i =0; i < peakCount; i++){
            if (this.ms1Peaks[i].MZ >= minmz && this.ms1Peaks[i].MZ <= maxmz && this.ms1Peaks[i].RETENTIONTIME >= minrt && this.ms1Peaks[i].RETENTIONTIME <= maxrt)
            {
                curMs1Peaks.push(this.ms1Peaks[i]);
            }
        }
        let peaksToAdd = points.splice(0, Math.min(this.maxPeaks - curMs1Peaks.length, points.length) - 1);
    
        this.currentData = ms1Peaks.concat(peaksToAdd);
    }
    console.log("peakCount : ", this.currentData.length);
}
// plots a single point on the graph
MsGraph.prototype.plotPoint = function(point) {
    // point: an array of the following values
    var id = point.ID;
    //var trace = point[1];
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

    if (this.useCylinders) {
        // cylinders are single objects that act as thick lines and as pinheads (from above)
        var cylgeo = new THREE.CylinderBufferGeometry(this.CYLINDER_RADIUS_CURRENT, this.CYLINDER_RADIUS_CURRENT, y);
        var cyl = new THREE.Mesh(cylgeo, meshmat);
        // y position is "center" of cylinder on long axis
        cyl.position.set(mz, y/2, rt);
        drawObj = cyl;
    } else {
        // thin lines and pinheads on the other hand are separate objects
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
    }
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
    //console.log("intScale: ", r.intscale)
   // console.log("multiply: ", this.GRID_RANGE_VERTICAL / heightScale * r.intscale)
    this.datagroup.scale.set(mz_squish, (this.GRID_RANGE_VERTICAL / heightScale) * r.intscale, rt_squish);
        
    // Reposition the plot so that mzmin,rtmin is at the correct corner
    this.datagroup.position.set(-r.mzmin*mz_squish, 0, this.GRID_RANGE - r.rtmin*rt_squish);

    // Scaling datagroup also "squishes" everything inside, so individually stretch
    // each point back out by the inverse of the squish amount.
    var mz_stretch = 1/mz_squish;
    var rt_stretch = 1/rt_squish;

    this.markerGroup.children.forEach(function(p) { p.scale.set(mz_stretch, 1, rt_stretch); });
    this.plotGroup.children.forEach(function(p) { p.scale.set(mz_stretch, 1, rt_stretch); });

    // update the set of visible points
    var nVisible = 0;
    var intmin = 0, intmax = 0;
    this.plotGroup.children.forEach(function(p) {
        p.visible = false;
        if (p.mz >= r.mzmin - 1e-4 && p.mz <= r.mzmax + 1e-4 && p.rt >= r.rtmin - 1e-4 && p.rt <= r.rtmax + 1e-4) {
            nVisible++;
            p.visible = true;
            intmin = Math.min(intmin, p.int);
            intmax = Math.max(intmax, p.int);
        }
    }, this);
    this.markerGroup.children.forEach(function(m) {
        var p = m.position;
        var inRange = p.x >= r.mzmin - 1e-4 && p.x <= r.mzmax + 1e-4 && p.z >= r.rtmin - 1e-4 && p.z <= r.rtmax + 1e-4;
        m.visible = inRange;
    });
    
    this.nPointsVisible = nVisible;

    r.intmin = intmin;
    r.intmax = intmax;
    
    // update edge indicators
    var edgesGroup = this.edgesGroup;
    var edgeMaterial = new THREE.LineBasicMaterial({ color: "red" });
    // draws a line for the edge of the data to indicate can't pan any more
    var makeEdgeLine = function(mzmin, mzmax, rtmin, rtmax) {
        var edgeGeo = new THREE.Geometry();
        edgeGeo.vertices.push(new THREE.Vector3(mzmin, 0, rtmin));
        edgeGeo.vertices.push(new THREE.Vector3(mzmax, 0, rtmax));
        var edgeLine = new THREE.Line(edgeGeo, edgeMaterial);
        edgesGroup.add(edgeLine);
    };

    MsGraph.emptyGroup(edgesGroup);
    if (r.mzmin <= this.dataRange.mzmin + 1e-4) {
        makeEdgeLine(r.mzmin, r.mzmin, r.rtmin, r.rtmax);
    }
    if (r.mzmax >= this.dataRange.mzmax - 1e-4) {
        makeEdgeLine(r.mzmax, r.mzmax, r.rtmin, r.rtmax);
    }
    if (r.rtmin <= this.dataRange.rtmin + 1e-4) {
        makeEdgeLine(r.mzmin, r.mzmax, r.rtmin, r.rtmin);
    }
    if (r.rtmax >= this.dataRange.rtmax - 1e-4) {
        makeEdgeLine(r.mzmin, r.mzmax, r.rtmax, r.rtmax);
    }
    
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

    //this.redrawRuler();
    //this.redrawGuard();

    console.log("after repositionPlot length : ", this.plotGroup.children.length);
};

// draws the ruler with the given gap between ticks at the given mz and rt
MsGraph.prototype.drawRuler = function(gap, mz, rt) {
    // reset ruler parameters
    var ruler = this.ruler;
    ruler.gap = gap;
    ruler.mz = mz;
    ruler.rt = rt;
    ruler.position.set(mz, 0, rt);
    MsGraph.emptyGroup(ruler);

    var vr = this.viewRange;

    var rulerWidth = (this.RULER_TICKS - 1) * gap;
    var leftEdge = mz - gap;

    // if the ruler is positioned outside of the graph, don't draw it
    if (!isFinite(leftEdge) || leftEdge + rulerWidth < vr.mzmin || leftEdge > vr.mzmax) { return; }
    if (!isFinite(rt) || rt < vr.rtmin || rt > vr.rtmax) { return; }

    var mat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
    var addLine = function (width, height, x) {
        var geo = new THREE.PlaneGeometry(width, height);
        var obj = new THREE.Mesh(geo, mat);

        // plane geometry isn't at the angle we want
        obj.rotateX(Math.PI/2);

        // 'position' is the center of the plane, but we want 'x' to be the left edge
        obj.position.set(x + width/2, 0, 0);
        MsGraph.setOnTop(obj);
        ruler.add(obj);
    };

    // calculate ratios to keep a consistent "physical" size on placement
    var verticalRatio = this.viewRange.rtrange / this.GRID_RANGE;
    var horizontalRatio = this.viewRange.mzrange / this.GRID_RANGE;

    // draw the horizontal bar
    addLine(rulerWidth, 0.1 * verticalRatio, -gap);

    // draw each vertical bar
    for(var i = 0; i < this.RULER_TICKS; i += 1) {
        addLine(0.1 * horizontalRatio, this.viewRange.rtrange / 10, (i-1) * gap)
    }
}

// redraws and resizes the ruler at its current location
MsGraph.prototype.redrawRuler = function() {
    var ruler = this.ruler;
    this.drawRuler(ruler.gap, ruler.mz, ruler.rt);
}

// draws a segmentation guard at the given mz with the given width
MsGraph.prototype.drawGuard = function(mz, width) {
    // reset guard parameters
    var guard = this.guardGroup;
    guard.mz = mz;
    guard.width = width;
    MsGraph.emptyGroup(guard);

    var vr = this.viewRange;

    // if the guard is positioned outside of the graph, don't draw it
    if (!isFinite(mz) || mz < vr.mzmin || mz > vr.mzmax) { return; }

    var x1 = this.mzRtToGridSpace(mz - width/2).x;
    var x2 = this.mzRtToGridSpace(mz + width/2).x;
    var z1 = 0;
    var z2 = this.GRID_RANGE;

    var geo = new THREE.BufferGeometry();
    var vertices = new Float32Array([
        x1, 0, z1,
        x1, 0, z2,
        x2, 0, z1,
        x2, 0, z2
    ]);
    geo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));

    var material = new THREE.LineBasicMaterial({ color: 0xff0000 });
    var lines = new THREE.LineSegments(geo, material);
    MsGraph.setOnTop(lines);
    guard.add(lines);
};

// set the width of the segmentation guard without changing its position
MsGraph.prototype.setGuardWidth = function(newWidth) {
    this.guardGroup.width = newWidth;
    this.redrawGuard();
};

// redraws the guard at its current position
MsGraph.prototype.redrawGuard = function() {
    var guard = this.guardGroup;
    this.drawGuard(guard.mz, guard.width);
};
