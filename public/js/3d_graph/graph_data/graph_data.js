/*graph_data.js : draws and manages the peaks on the screen*/
class GraphData{
    constructor(){}
    /******** GRAPH RESET ******/
    static clearGraph = () => {
        GraphUtil.emptyGroup(Graph.scene.getObjectByName("plotGroup"));
        GraphUtil.emptyGroup(Graph.scene.getObjectByName("markerGroup"));
        GraphUtil.emptyGroup(Graph.scene.getObjectByName("featureGroup"));
    }
    /******** ADD HORIZONTAL MARKER FOR WHERE CURRENT SCANS ARE ******/
    static drawCurrentScanMarker = (rt) => {
        let markerGroup = Graph.scene.getObjectByName("markerGroup");
        //draw a red line horizontal to x axis where y = current scan retention time
        let linegeo = new THREE.Geometry();
            
        linegeo.vertices.push(new THREE.Vector3(0, 0.1, 0));
        linegeo.vertices.push(new THREE.Vector3(Graph.gridRange, 0.1, 0));
    
        let linemat = new THREE.LineBasicMaterial({color: Graph.currentScanColor});
    
        let marker = new THREE.Line(linegeo, linemat);
        marker.name = "currentScanMarker";
        markerGroup.add(marker);

        marker.position.set(0, 0, rt);
    }
    /******** CALCULATE AND SET DATA RANGE ******/
    static getInteRange = (points) => {
        let intmin = Infinity;
        let intmax = 0;
        Graph.intensitySum = 0;
        for (let i = 0; i < points.length; i++){
            if (points[i].INTENSITY < intmin){
                intmin = points[i].INTENSITY;
            }
            if(points[i].INTENSITY > intmax){
                intmax = points[i].INTENSITY;
            }
            Graph.intensitySum = Graph.intensitySum + points[i].INTENSITY;
        }
        Graph.viewRange.intmin = intmin;
        Graph.viewRange.intmax = intmax;
        Graph.viewRange.intrange = intmax - intmin;
        //console.log("lowest intensity peak on screen has ", intmin, " intensity")
    }
    static setInitViewRange = (mzminRaw, mzmaxRaw, curRTRaw) => {
        let curRT = parseFloat(curRTRaw);
        let rtmax = parseFloat(curRT + Graph.rtRange);
        let rtmin = parseFloat(curRT - Graph.rtRange);
        let mzmax = parseFloat(mzmaxRaw);
        let mzmin = parseFloat(mzminRaw);
        
        let dataTotal = Graph.tablePeakCount[0];

        if (rtmax > dataTotal.RTMAX){
            rtmax = dataTotal.RTMAX;
        }
        if (rtmin < 0){
            rtmin = 0;
        }
        if (mzmax > dataTotal.MZMAX){
            mzmax = dataTotal.MZMAX;
        }
        if (mzmin < 0){
            mzmin = 0;
        }
        Graph.curRT = curRT;

        Graph.viewRange.mzmin = mzmin;
        Graph.viewRange.mzmax = mzmax;
        Graph.viewRange.mzrange = mzmax - mzmin;
        
        Graph.viewRange.rtmin = rtmin;
        Graph.viewRange.rtmax = rtmax;
        Graph.viewRange.rtrange = rtmax - rtmin;
    }
    static setViewRange = (mzmin, mzmax, rtmax, rtmin, curRT) => {
        let dataTotal = Graph.tablePeakCount[0];

        if (rtmax > dataTotal.RTMAX){
            rtmax = dataTotal.RTMAX;
        }
        if (rtmin < 0){
            rtmin = 0;
        }
        if (mzmax > dataTotal.MZMAX){
            mzmax = dataTotal.MZMAX;
        }
        if (mzmin < 0){
            mzmin = 0;
        }
        Graph.curRT = curRT;

        Graph.viewRange.mzmin = mzmin;
        Graph.viewRange.mzmax = mzmax;
        Graph.viewRange.mzrange = mzmax - mzmin;
        
        Graph.viewRange.rtmin = rtmin;
        Graph.viewRange.rtmax = rtmax;
        Graph.viewRange.rtrange = rtmax - rtmin;
    }
     /******** PLOT PEAKS ******/
    static updateGraph = (minmz, maxmz,minrt,maxrt, curRT, updateTextBox) => {
        GraphData.setViewRange(minmz, maxmz, maxrt, minrt, curRT);
        GraphData.draw(curRT);
        if (updateTextBox){
            GraphUtil.updateTextBox();
        }
    }
    static drawInitGraph = (minmz, maxmz, curRT, updateTextBox) => {
        GraphData.setInitViewRange(minmz, maxmz, curRT);
        GraphData.draw(curRT);
        if (updateTextBox){
            GraphUtil.updateTextBox();
        }
    }
     /******** PLOT PEAKS ******/
    static draw = (curRT) => {          
        const curViewRange = Graph.viewRange;
        
        let promise = LoadData.load3dData(curViewRange);

        promise.then(peakData => {
            GraphData.clearGraph();    
            Graph.currentData = peakData;
            GraphData.getInteRange(Graph.currentData);
    
            //if camera angle is perpendicular to the graph plane
            if (Graph.isPerpendicular){
                GraphData.plotPoint2D();
            }
            else{
                for (let i = 0; i < Graph.currentData.length; i++){   
                    GraphData.plotPoint(Graph.currentData[i]);
                }  
            }
            Graph.viewRange["intscale"] = 1;

            // make sure the groups are plotted and update the view
            if (parseFloat(curRT) <= Graph.viewRange.rtmax && parseFloat(curRT) >= Graph.viewRange.rtmin){
                GraphData.drawCurrentScanMarker(curRT);
            }
            GraphLabel.displayGraphData(Graph.currentData.length);//display metadata about the graph
        }).then(() => {
            let promise = GraphFeature.drawFeature(Graph.viewRange);
            promise.then(function(){})
        }).then(() => {
            GraphControl.updateViewRange(Graph.viewRange);
            GraphRender.renderImmediate();
        })
    }
    /*when camera angle is perpendicular, draw circle instead of a vertical peak*/
    static plotPoint2D = () => {
        let prevSpecRT = Graph.viewRange.rtmax; 
        let prevPeakRT = 0;

        let rt = document.getElementById("scan1RT").innerText;
    
        let dataGroup = Graph.scene.getObjectByName("dataGroup");
        let peak2DGroup; 
        
        if (dataGroup.children.length > 2){
            for (let i = 0; i < dataGroup.children.length; i++){
                if (dataGroup.children[i].name == "peak2DGroup"){
                    dataGroup.children[i].children = [];
                    peak2DGroup = dataGroup.children[i];
                };
            }
        }
        else{
            peak2DGroup = new THREE.Group(); 
            peak2DGroup.name = "peak2DGroup";
        }
        //sort data by rt
        Graph.currentData.sort(GraphUtil.sortByRT);
        
        if (Graph.currentData.length > 0){
            prevPeakRT = Graph.currentData[Graph.currentData.length - 1].RETENTIONTIME;
        }
        for (let i = Graph.currentData.length - 1; i >= 0; i--){   
            let point = Graph.currentData[i];
            let linegeo = new THREE.BufferGeometry();

            //ySize is current retention time - prevRT
            //for the first spectra peaks, it is a set length;
            //while current peak has same RT as the previous peak, keep iterating
            //if current peak has different RT as the previous peak, update prevRT as the previous peak RT
            
            if (point.RETENTIONTIME != prevPeakRT){
                prevSpecRT = prevPeakRT;
            }

            let ySize = prevSpecRT - point.RETENTIONTIME; //peak length
            let rtRange = (Graph.viewRange.rtmax - Graph.viewRange.rtmin)/60;
            let minSize = rtRange/3;

            if (ySize < minSize){//minimum length for the peak
    
                ySize = minSize;
            }
            linegeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array([
                0, 0, 0,
                0, 0, ySize,
            ]), 3));
            
            let linemat = new THREE.LineBasicMaterial({color: point.COLOR, linewidth:0.8});
        
            if ((point.RETENTIONTIME/60).toFixed(4) == rt){
                linemat = new THREE.LineBasicMaterial({color: Graph.currentScanColor});
            }
            let line = new THREE.Line(linegeo, linemat);

            line.position.set(point.MZ, 0, point.RETENTIONTIME);
            line.pointid = point.ID;
            line.mz = point.MZ;
            line.rt = point.RETENTIONTIME;
            line.int = point.INTENSITY;
            line.name = "peak";
            line.scanID = point.SPECTRAID;
            peak2DGroup.add(line);

            prevPeakRT = point.RETENTIONTIME;
        }
        // Reposition the plot so that mzmin,rtmin is at the correct corner
        dataGroup.add(peak2DGroup);
    }
    /*plots a peak as a vertical line on the graph*/
    static plotPoint = (point) => {
        let plotGroup = Graph.scene.getObjectByName("plotGroup");

        let id = point.ID;
        let mz = point.MZ;
        let rt = point.RETENTIONTIME;
        let inten = point.INTENSITY;
        let lineColor = point.COLOR;

        let lowPeak = false;

        let currt = document.getElementById("scan1RT").innerText;
        let y = inten;    
        let minHeight = Graph.minPeakHeight;
        let scale = Graph.gridRangeVertical / Graph.viewRange.intmax;
        //if y is much smaller than the highest intensity peak in the view range
        if (scale * y < minHeight){
            //increase y so that later y is at least minHeight when scaled
            y = y * (minHeight/(scale * y));
            lowPeak = true;
        }

        let linegeo = new THREE.BufferGeometry();
        
        linegeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array([
            0, 0, 0,
            0, y, 0,
        ]), 3));
    
        let linemat = new THREE.LineBasicMaterial({color: lineColor});
    
        if ((point.RETENTIONTIME/60).toFixed(4) == currt){
            linemat = new THREE.LineBasicMaterial({color: Graph.currentScanColor});
        }
        let line = new THREE.Line(linegeo, linemat);
        
        line.position.set(mz, 0, rt);
        line.pointid = id;
        line.mz = mz;
        line.rt = rt;
        line.int = inten;
        line.height = y;
        line.name = "peak";
        line.scanID = point.SPECTRAID;

        if (lowPeak){
            line.lowPeak = true;
        }
        plotGroup.add(line);
    }
}