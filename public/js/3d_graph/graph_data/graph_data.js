/*graph_data.js : draws and manages the peaks on the screen*/
class GraphData{
    constructor(){}
    /******** GRAPH RESET ******/
    static clearGraph = () => {
        GraphUtil.emptyGroup(Graph.scene.getObjectByName("plotGroup"));
        GraphUtil.emptyGroup(Graph.scene.getObjectByName("markerGroup"));
        GraphUtil.emptyGroup(Graph.scene.getObjectByName("featureGroup"));
    }
    /******** PEAK COLOR ASSIGNMENT ******/
   /*static pickPeakColor = (intensity) => {
        for (let j = 0; j < Graph.cutoff.length; j++){
            if (intensity <= Graph.cutoff[j]){
                return Graph.gradientColor[j];
            }
        }
        return Graph.gradientColor[Graph.gradientColor.length - 1];
    }*/
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
        console.log("lowest intensity peak on screen has ", intmin, " intensity")
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
            if (Graph.camera.position.y > 25.495){
                GraphData.plotPointAsCircle(Graph.currentData);
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
    static plotPointAsCircle = () => {
        let mzRange = Graph.viewRange.mzmax - Graph.viewRange.mzmin;
        let rtRange = (Graph.viewRange.rtmax - Graph.viewRange.rtmin)/60;
    
        let xSize = mzRange / 100;
        let ySize = rtRange;
    
        let rt = document.getElementById("scan1RT").innerText;
    
        let prevGroup = Graph.scene.getObjectByName("cylinderGroup");
        let dataGroup = Graph.scene.getObjectByName("dataGroup");
        let cylinderGroup; 

        if (prevGroup == undefined){
            cylinderGroup = new THREE.Group();//when view angle is perpendicular
            cylinderGroup.name = "cylinderGroup";
            dataGroup.add(cylinderGroup);
        }
        else{
            cylinderGroup = prevGroup;
        }

        for (let i = 0; i < Graph.currentData.length; i++){   
            let point = Graph.currentData[i];
            //let lineColor = GraphData.pickPeakColor(Graph.currentData[i].INTENSITY);
            let lineColor = point.COLOR;
            let geometry = new THREE.BoxBufferGeometry( xSize, 1, ySize );
            let material = new THREE.MeshBasicMaterial( { color: lineColor } );
       
            if ((point.RETENTIONTIME/60).toFixed(4) == rt){
                material = new THREE.MeshBasicMaterial({color: 0xED1111});
            }
            let circle = new THREE.Mesh( geometry, material );
    
            circle.position.set(point.MZ, 0, point.RETENTIONTIME);
    
            circle.pointid = point.ID;
            circle.mz = point.MZ;
            circle.rt = point.RETENTIONTIME;
            circle.int = point.INTENSITY;
            circle.height = 10;
            circle.name = "point";
            circle.scanID = point.SPECTRAID;
            cylinderGroup.add(circle);
        }
        //repositioning m/z and rt from repositionPlot
        let heightScale = Graph.viewRange.intmax;
        let mz_squish = Graph.gridRange / Graph.viewRange.mzrange;
        let rt_squish = - Graph.gridRange / Graph.viewRange.rtrange;
        
        if (Graph.viewRange.intmax < 1){
            inte_squish = 0;
        }
        // Reposition the plot so that mzmin,rtmin is at the correct corner
        dataGroup.position.set(-Graph.viewRange.mzmin*mz_squish, 0.01, Graph.gridRange - Graph.viewRange.rtmin*rt_squish);
    }
    /*plots a peak as a vertical line on the graph*/
    static plotPoint = (point) => {
        let plotGroup = Graph.scene.getObjectByName("plotGroup");

        let id = point.ID;
        let mz = point.MZ;
        let rt = point.RETENTIONTIME;
        let inten = point.INTENSITY;
        let lineColor = point.COLOR;

        //let lineColor = GraphData.pickPeakColor(inten);

        let currt = document.getElementById("scan1RT").innerText;
        let y = inten;    
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

        plotGroup.add(line);
    }
}