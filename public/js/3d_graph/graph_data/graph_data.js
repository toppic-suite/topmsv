/*graph_data.js : draws and manages the peaks on the screen*/
class GraphData{
    constructor(){}
    /******** GRAPH RESET ******/
    static clearGraph = () => {
        //GraphUtil.emptyGroup(Graph.scene.getObjectByName("plotGroup"));
        GraphUtil.emptyGroup(Graph.scene.getObjectByName("markerGroup"));
        //GraphUtil.emptyGroup(Graph.scene.getObjectByName("featureGroup"));
    }
    /******** ADD HORIZONTAL MARKER FOR WHERE CURRENT SCANS ARE ******/
    static drawCurrentScanMarker = () => {
        let markerGroup = Graph.scene.getObjectByName("markerGroup");
        //draw a red line horizontal to x axis where y = current scan retention time
        let linegeo = new THREE.Geometry();
            
        linegeo.vertices.push(new THREE.Vector3(0, 0.1, 0));
        linegeo.vertices.push(new THREE.Vector3(Graph.gridRange, 0.1, 0));
    
        let linemat = new THREE.LineBasicMaterial({color: Graph.currentScanColor});
    
        let marker = new THREE.Line(linegeo, linemat);
        marker.name = "currentScanMarker";
        markerGroup.add(marker);

        marker.position.set(0, 0, Graph.curRT);
       /* marker.visible = true;

        if (Graph.curRT < Graph.viewRange.rtmin || Graph.curRT > Graph.viewRange.rtmax) {
            marker.visible = false;
        }*/
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
        
        let dataTotal = Graph.configData[0];

        if (rtmax > dataTotal.RTMAX){
            rtmax = dataTotal.RTMAX;
        }
        if (rtmin < 0){
            rtmin = 0;
        }
        /*if (mzmax > dataTotal.MZMAX){
            mzmax = dataTotal.MZMAX;
        }*/
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
        let dataTotal = Graph.configData[0];

        if (rtmax > dataTotal.RTMAX){
            rtmax = dataTotal.RTMAX;
        }
        if (rtmin < 0){
            rtmin = 0;
        }
        /*if (mzmax > dataTotal.MZMAX){
            mzmax = dataTotal.MZMAX;
        }*/
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
    static updateGraph = (mzmin, mzmax,rtmin, rtmax, curRT) => {
        GraphData.setViewRange(mzmin, mzmax, rtmax, rtmin, curRT);
        GraphData.draw(curRT);
        if (Graph.isUpdateTextBox){
            GraphUtil.updateTextBox();
        }
    }
    static updateGraphNoNewData = (mzmin, mzmax,rtmin, rtmax, curRT) => {
        GraphData.setViewRange(mzmin, mzmax, rtmax, rtmin, curRT);
        GraphData.drawNoNewData(curRT);
        if (Graph.isUpdateTextBox){
            GraphUtil.updateTextBox();
        }
    }
    static drawInitGraph = (mzmin, mzmax, scanID) => {
        let promise = LoadData.getRT(scanID);
        promise.then((curRT) =>{
            GraphData.setInitViewRange(mzmin, mzmax, curRT);
            GraphData.draw(curRT);
            if (Graph.isUpdateTextBox){
                GraphUtil.updateTextBox();
            }
        })
    }
     /******** PLOT PEAKS ******/
    /*static draw = (curRT) => {          
        const curViewRange = Graph.viewRange;
        Graph.curRT = curRT;
        let promise = await LoadData.load3dData(curViewRange);

        promise.then(peakData => {
            Graph.currentData = peakData;
            GraphData.getInteRange(Graph.currentData);
    
            //if camera angle is perpendicular to the graph plane
            if (Graph.isPerpendicular){
                GraphData.plotPoint2D();
            }
            else{
                GraphData.updatePeaks(Graph.currentData);
            }
            Graph.viewRange["intscale"] = 1;

            // make sure the groups are plotted and update the view
            if (parseFloat(Graph.curRT) <= Graph.viewRange.rtmax && parseFloat(Graph.curRT) >= Graph.viewRange.rtmin){
                GraphData.drawCurrentScanMarker();
            }
            GraphLabel.displayGraphData(Graph.currentData.length);//display metadata about the graph
            console.log("1");
            return 0;
        }).then(result => {
            console.log("2");
            let promise = GraphFeature.drawFeature(Graph.viewRange);
            promise.then(()=>{
                console.log("6");
                return 0;
            })  
        }).then(result => {
            console.log("7");

            GraphControl.updateViewRange(Graph.viewRange);
            GraphRender.renderImmediate();
        });
    }*/
    static draw = async(curRT) => {          
        const curViewRange = Graph.viewRange;
        Graph.curRT = curRT;
        //Graph.currentData = await LoadData.load3dData(curViewRange);
        GraphData.getInteRange(Graph.currentData);

        //if camera angle is perpendicular to the graph plane
        if (Graph.isPerpendicular){
            //GraphData.plotPoint2D();
        }
        else{
            //GraphData.updatePeaks(Graph.currentData);
        }
        Graph.viewRange["intscale"] = 1;

        // make sure the groups are plotted and update the view
        if (parseFloat(Graph.curRT) <= Graph.viewRange.rtmax && parseFloat(Graph.curRT) >= Graph.viewRange.rtmin){
            //GraphData.drawCurrentScanMarker();
        }
        GraphLabel.displayGraphData(Graph.currentData.length);//display metadata about the graph

        await GraphFeature.drawFeature(Graph.viewRange);

        GraphControl.updateViewRange(Graph.viewRange);
        GraphRender.renderImmediate();
    }
    static drawNoNewData = (curRT) => {
        //if camera angle is perpendicular to the graph plane
        if (Graph.isPerpendicular){
            GraphData.plotPoint2D();
        }
        else{
            GraphData.updatePeaks(Graph.currentData);
        }
        Graph.viewRange["intscale"] = 1;

        // make sure the groups are plotted and update the view
        if (parseFloat(Graph.curRT) <= Graph.viewRange.rtmax && parseFloat(Graph.curRT) >= Graph.viewRange.rtmin){
            GraphData.drawCurrentScanMarker();
        }
        else{
            GraphUtil.emptyGroup(Graph.scene.getObjectByName("markerGroup"));
        }
        GraphLabel.displayGraphData(Graph.currentData.length);//display metadata about the graph

        GraphControl.updateViewRange(Graph.viewRange);
        GraphRender.renderImmediate();
    }
    /*when camera angle is perpendicular, draw circle instead of a vertical peak*/
    static plotPoint2D = () => {
        let prevSpecRT = 0; 
        let prevPeakRT = 0;

        let rt = (Graph.curRT/60).toFixed(4);
        //let rt = document.getElementById("scan1RT").innerText;
    
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

            //for special cases when should not be using the calculated ysize value
            if (ySize < minSize){//minimum length for the peak
                ySize = minSize;
            }
            if (prevSpecRT == 0){//when it is the spectra peaks with the highets rt (no previous spectra)
                ySize = rtRange / 2;
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
    static updatePeaks = (data) => {
        let plotGroup = Graph.scene.getObjectByName("plotGroup");

        //iterate through peask in plot group while < data.length;
        //for the rest of peaks, turn off visibility
        plotGroup.children.forEach(function(line, index) {
            if (index < data.length) {
                let point = data[index];
                let id = point.ID;
                let mz = point.MZ;
                let rt = point.RETENTIONTIME;
                let inten = point.INTENSITY;
                let lineColor = point.COLOR;

                if (mz >= Graph.viewRange.mzmin && mz <= Graph.viewRange.mzmax &&
                    rt >= Graph.viewRange.rtmin && rt <= Graph.viewRange.rtmax) {
                    let lowPeak = false;

                    let currt = (Graph.curRT/60).toFixed(4);
                    let y = inten;    
                    let minHeight = Graph.minPeakHeight;
                    //if y is much smaller than the highest intensity peak in the view range
                    if (y * plotGroup.scale.y < minHeight){
                        //increase y so that later y is at least minHeight when scaled
                        y = minHeight/plotGroup.scale.y;
                        lowPeak = true;
                    }
                    line.geometry.attributes.position.array[4] = y;
                    line.geometry.attributes.position.needsUpdate = true; 
                    line.material.color.setStyle(lineColor);
                    if ((point.RETENTIONTIME/60).toFixed(4) == currt){
                        line.material.color.setStyle(Graph.currentScanColor);
                    }
                    line.position.set(mz, 0, rt);
                    line.pointid = id;
                    line.mz = mz;
                    line.rt = rt;
                    line.int = inten;
                    line.height = y;
                    line.name = "peak";
                    line.scanID = point.SPECTRAID;
                    line.visible = true;
    
                    if (lowPeak){
                        line.lowPeak = true;
                    }else{
                        line.lowPeak = false;
                    }
                }
                else{
                    line.visible = false;
                }
            }
            else{
                line.visible = false;
                line.lowPeak = false;
            }
        })
    }
    /*plots a peak as a vertical line on the graph*/
    /*static plotPoint = (point) => {
        let plotGroup = Graph.scene.getObjectByName("plotGroup");
        
        let id = point.ID;
        let mz = point.MZ;
        let rt = point.RETENTIONTIME;
        let inten = point.INTENSITY;
        let lineColor = point.COLOR;

        let lowPeak = false;

        let currt = (Graph.curRT/60).toFixed(4);
        let y = inten;    
        let minHeight = Graph.minPeakHeight;
        //if y is much smaller than the highest intensity peak in the view range
        if (y * plotGroup.scale.y < minHeight){
            //increase y so that later y is at least minHeight when scaled
            y = minHeight/plotGroup.scale.y;
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
    }*/
}
