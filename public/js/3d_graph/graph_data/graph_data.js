// graph_data.js : draws and manages the peaks on the screen
class GraphData{
    constructor(){
        this.plotGroup = Graph.scene.getObjectByName("plotGroup");
        this.markerGroup = Graph.scene.getObjectByName("markerGroup");
        this.featureGroup = Graph.scene.getObjectByName("featureGroup");
    }
    /******** GRAPH RESET ******/
    clearGraph() {
        this.plotGroup.children = [];
        this.markerGroup.children = [];
        this.featureGroup.children = [];
    }
    /******** PEAK COLOR ASSIGNMENT ******/
    pickPeakColor(intensity){
        for (let j = 0; j < Graph.cutoff.length; j++){
            if (intensity <= Graph.cutoff[j]){
                return Graph.gradientColor[j];
            }
        }
        return Graph.gradientColor[Graph.gradientColor.length - 1];
    }
    /******** ADD HORIZONTAL MARKER FOR WHERE CURRENT SCANS ARE ******/
    drawCurrentScanMarker(rt){
        //draw a red line horizontal to x axis where y = current scan retention time
        let linegeo = new THREE.Geometry();
            
        linegeo.vertices.push(new THREE.Vector3(0, 0.1, 0));
        linegeo.vertices.push(new THREE.Vector3(Graph.gridRange, 0.1, 0));
    
        let linemat = new THREE.LineBasicMaterial({color: Graph.currentScanColor});
    
        let marker = new THREE.Line(linegeo, linemat);
        marker.name = "currentScanMarker";
        this.markerGroup.add(marker);

        marker.position.set(0, 0, rt);
    }
    /******** PLOT PEAKS ******/
    getInteRange(points){
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
    }
    drawGraph(minmz, maxmz, minrt, maxrt, curRT, updateTextBox){        
        this.clearGraph();
       
        let self = this;
        let promise = LoadData.load3dDataByParaRange(minmz, maxmz, minrt, maxrt, curRT, updateTextBox);
        
        promise.then(function(peakData){
            self.currentData = peakData;

            Graph.viewRange.mzmin = minmz;
            Graph.viewRange.mzmax = maxmz;
            Graph.viewRange.mzrange = maxmz - minmz;
        
            Graph.viewRange.rtmin = minrt;
            Graph.viewRange.rtmax = maxrt;
            Graph.viewRange.rtrange = maxrt - minrt;
            
            self.getInteRange(self.currentData);
    
            //if camera angle is perpendicular to the graph plane
            if (Graph.camera.position.y > 25.495){
                self.plotPointAsCircle(self.currentData);
            }
            else{
                let prevGroup = Graph.scene.getObjectByName("cylinderGroup");
                if (prevGroup != undefined){
                    Graph.scene.remove(prevGroup);
                }
                for (let i = 0; i < self.currentData.length; i++){   
                    self.plotPoint(self.currentData[i]);
                }
            }
            Graph.viewRange["intscale"] = 1;
        
            // make sure the groups are plotted and update the view
            if (rt <= maxrt && rt >= minrt){
                self.drawCurrentScanMarker(rt);
            }
            GraphFeature.drawFeature(Graph.viewRange);
            GraphLabel.displayGraphData(self.currentData.length);//display metadata about the graph
            GraphControl.updateViewRange(Graph.viewRange);
            GraphRender.renderImmediate();
        })
    }
    /*when camera angle is perpendicular, draw circle instead of a vertical peak*/
    plotPointAsCircle = function(){
        let mzRange = Graph.viewRange.mzmax - Graph.viewRange.mzmin;
        let rtRange = (Graph.viewRange.rtmax - Graph.viewRange.rtmin)/60;
    
        let xSize = mzRange / 100;
        let ySize = rtRange;
    
        //called from renderImmediate when view is perpendicular
        let scanID = document.getElementById('scanID1').innerText;
        let rt = document.getElementById("scan1RT").innerText;
    
        let prevGroup = Graph.scene.getObjectByName("cylinderGroup");
        let cylinderGroup = new THREE.Group();//when view angle is perpendicular

        if (prevGroup != undefined){
            cylinderGroup = prevGroup;
        }
        for (let i = 0; i < this.currentData.length; i++){   
            let point = this.currentData[i];
            let lineColor = this.pickPeakColor(this.currentData[i].INTENSITY);
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
        let inte_squish = (Graph.gridRangeVertical / heightScale) * Graph.viewRange.intscale;
    
        if (Graph.viewRange.intmax < 1){
            //there is a problem when there is no peak --> this.dataRange.intmax becomes 0 and inte_squish is a result of dividing by zero
            inte_squish = 0;
        }
        // Reposition the plot so that mzmin,rtmin is at the correct corner
        cylinderGroup.position.set(-Graph.viewRange.mzmin*mz_squish, inte_squish, Graph.gridRange - Graph.viewRange.rtmin*rt_squish);
        cylinderGroup.name = "cylinderGroup";

        Graph.scene.add(cylinderGroup);
        console.log("cylinderGroup", cylinderGroup)
    }
    /*plots a peak as a vertical line on the graph*/
    plotPoint = function(point) {
        let id = point.ID;
        let mz = point.MZ;
        let rt = point.RETENTIONTIME;
        let inten = point.INTENSITY;
        let lineColor = this.pickPeakColor(inten);
           
        let scanID = document.getElementById('scanID1').innerText;
        let currt = document.getElementById("scan1RT").innerText;
    
        let y = inten;
        
        let drawObj;
    
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
    
        drawObj = line;

        drawObj.pointid = id;
        drawObj.mz = mz;
        drawObj.rt = rt;
        drawObj.int = inten;
        drawObj.height = y;
        drawObj.name = "peak";
        drawObj.scanID = point.SPECTRAID;
        
        this.plotGroup.add(drawObj);
    }
}