/*graph_data.js : draws and manages the peaks on the screen*/
class GraphData{
    constructor(){}
    
    /******** ADD HORIZONTAL MARKER FOR WHERE CURRENT SCANS ARE ******/
    static drawCurrentScanMarker = () => {
        let markerGroup = Graph.scene.getObjectByName("markerGroup");
        markerGroup.children.forEach(function(line) {
            line.position.set(0, 0.01, Graph.curRT);
            line.visible = true;
            //line.geometry.attributes.position.needsUpdate = true;     
        })
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
    static setViewRangeToFull = () => {
        Graph.viewRange.mzmin = 0;
        Graph.viewRange.mzmax = Graph.dataRange.mzmax;
        Graph.viewRange.mzrange = Graph.dataRange.mzmax;
        
        Graph.viewRange.rtmin = 0;
        Graph.viewRange.rtmax = Graph.dataRange.rtmax;
        Graph.viewRange.rtrange = Graph.dataRange.rtmax;
    }
     /******** PLOT PEAKS ******/
    static updateGraph = async(mzmin, mzmax,rtmin, rtmax, curRT) => {
        GraphData.setViewRange(mzmin, mzmax, rtmax, rtmin, curRT);
        await GraphData.draw(curRT);
        /*if (Graph.isUpdateTextBox){
            GraphUtil.updateTextBox();
        }*/
    }
    static updateGraphNoNewData = (mzmin, mzmax,rtmin, rtmax, curRT) => {
        GraphData.setViewRange(mzmin, mzmax, rtmax, rtmin, curRT);
        GraphData.drawNoNewData(curRT);
        /*if (Graph.isUpdateTextBox){
            GraphUtil.updateTextBox();
        }*/
    }
    static drawFullRangeGraph = (scanID) => {
        let promise = LoadData.getRT(scanID);
        promise.then(() =>{
            GraphData.setViewRangeToFull();
            GraphData.draw(Graph.curRT);
            /*if (Graph.isUpdateTextBox){
                GraphUtil.updateTextBox();
            }*/
        })
    }
    static drawInitGraph = (mzmin, mzmax, scanID) => {
        let promise = LoadData.getRT(scanID);
        promise.then(async(curRT) =>{
            GraphData.setInitViewRange(mzmin, mzmax, curRT);
            await GraphData.draw(curRT);
            /*if (Graph.isUpdateTextBox){
                GraphUtil.updateTextBox();
            }*/
        })
    }
     /******** PLOT PEAKS ******/
    static draw = async(curRT) => {   
        const curViewRange = Graph.viewRange;
        Graph.curRT = parseFloat(curRT);
        Graph.currentData = await LoadData.load3dData(curViewRange);
        GraphData.getInteRange(Graph.currentData);
        //if camera angle is perpendicular to the graph plane
        if (Graph.isPerpendicular){
            await GraphData.plotPoint2D();
        }
        else{
            await GraphData.updatePeaks(Graph.currentData);
        }
        Graph.viewRange["intscale"] = 1;

        // make sure the groups are plotted and update the view
        if (parseFloat(Graph.curRT) <= Graph.viewRange.rtmax && parseFloat(Graph.curRT) >= Graph.viewRange.rtmin){
            await GraphData.drawCurrentScanMarker();
        }
        else{
            let markerGroup = Graph.scene.getObjectByName("markerGroup");
            markerGroup.children.forEach(function(line) {
                line.visible = false;
            })
        }
        GraphLabel.displayGraphData(Graph.currentData.length);//display metadata about the graph

        await GraphFeature.drawFeature(Graph.viewRange);

        GraphControl.updateViewRange(Graph.viewRange);
        GraphRender.renderImmediate();
    }
    static drawNoNewData = async() => {
        //if camera angle is perpendicular to the graph plane
        if (Graph.isPerpendicular){
            GraphData.plotPoint2D();
        }
        else{
            await GraphData.updatePeaks(Graph.currentData);
        }
        Graph.viewRange["intscale"] = 1;
        
        // make sure the groups are plotted and update the view
        if (parseFloat(Graph.curRT) <= Graph.viewRange.rtmax && parseFloat(Graph.curRT) >= Graph.viewRange.rtmin){
            GraphData.drawCurrentScanMarker();
        }
        else{
            let markerGroup = Graph.scene.getObjectByName("markerGroup");
            markerGroup.children.forEach(function(line) {
                line.visible = false;
            })    
        }
        GraphLabel.displayGraphData(Graph.currentData.length);//display metadata about the graph
        
        await GraphFeature.drawFeatureNoDataLoad(Graph.viewRange);

        GraphControl.updateViewRange(Graph.viewRange);
        GraphRender.renderImmediate();
    }
    static plotPoint2D = () => {
        let prevSpecRT = 0; 
        let prevPeakRT = 0;

        let rt = Graph.curRT.toFixed(4);
        //let rt = document.getElementById("scan1RT").innerText;
    
        let dataGroup = Graph.scene.getObjectByName("dataGroup");
        let peak2DGroup = Graph.peak2DGroup;
        
        //sort data by rt
        Graph.currentData.sort(GraphUtil.sortByRT);
                    
        if (Graph.currentData.length > 0){
            prevPeakRT = Graph.currentData[Graph.currentData.length - 1].RETENTIONTIME;
        }

        peak2DGroup.children.forEach(function(line, index) {
            if (index < Graph.currentData.length) {
                let point = Graph.currentData[Graph.currentData.length - 1 - index];

                if (point.MZ >= Graph.viewRange.mzmin && point.MZ <= Graph.viewRange.mzmax &&
                    point.RETENTIONTIME >= Graph.viewRange.rtmin && point.RETENTIONTIME <= Graph.viewRange.rtmax){
                        let lineColor = Graph.peakColor[point.COLOR];

                        //ySize is current retention time - prevRT
                        //for the first spectra peaks, it is a set length;
                        //while current peak has same RT as the previous peak, keep iterating
                        //if current peak has different RT as the previous peak, update prevRT as the previous peak RT
                        
                        if (point.RETENTIONTIME != prevPeakRT){
                            prevSpecRT = prevPeakRT;
                        }
        
                        let ySize = prevSpecRT - point.RETENTIONTIME; //peak length
                        let rtRange = Graph.viewRange.rtmax - Graph.viewRange.rtmin;
                        let minSize = rtRange/60;
        
                        //for special cases when should not be using the calculated ysize value
                        if (ySize < minSize){//minimum length for the peak
                            ySize = minSize;
                        }
                        if (prevSpecRT == 0){//when it is the spectra peaks with the highets rt (no previous spectra)
                            ySize = rtRange / (2 * 60);
                        }
                        line.geometry.attributes.position.array[5] = ySize;
                        line.geometry.attributes.position.needsUpdate = true; 
                        line.material.color.setStyle(lineColor);
                        
                        if (point.RETENTIONTIME.toFixed(4) == rt){
                            line.material.color.setStyle(Graph.currentScanColor);
                        }
        
                        line.position.set(point.MZ, 0, point.RETENTIONTIME);
                        line.pointid = point.ID;
                        line.mz = point.MZ;
                        line.rt = point.RETENTIONTIME;
                        line.int = point.INTENSITY;
                        line.name = "peak";
                        line.scanID = point.SPECTRAID;
                        line.visible = true;
        
                        prevPeakRT = point.RETENTIONTIME;
                }
                else{
                    line.visible = false;
                }
            }
            else{
                line.visible = false;
            }
            // Reposition the plot so that mzmin,rtmin is at the correct corner
            dataGroup.add(peak2DGroup);
        })

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
                let lineColor = Graph.peakColor[point.COLOR];

                if (mz >= Graph.viewRange.mzmin && mz <= Graph.viewRange.mzmax &&
                    rt >= Graph.viewRange.rtmin && rt <= Graph.viewRange.rtmax) {
                    let lowPeak = false;
                    let currt = Graph.curRT.toFixed(4);
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
                    if (point.RETENTIONTIME.toFixed(4) == currt){
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
}
