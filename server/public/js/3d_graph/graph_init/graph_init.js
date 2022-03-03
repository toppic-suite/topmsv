"use strict";
/*graph_init.js: class for initializing 3d graph*/
class GraphInit {
    constructor() { }
}
/******** GRAPH EVENTS******/
GraphInit.createSaveGraphEvent = () => {
    let save3dGraph = document.querySelector("#save3dGraph");
    if (save3dGraph) {
        save3dGraph.addEventListener("click", GraphDownload.save3dGraph, false);
    }
    else {
        console.error("there is no button for saving 3d graph");
    }
};
GraphInit.createSwitchCurrentScan = () => {
    let canvas3D = document.getElementById("canvas3D");
    if (!canvas3D) {
        console.error("graph element doesn't exist");
        return;
    }
    //change current scan when clicked on 3d graph
    canvas3D.addEventListener("click", function (e) {
        if (Graph.isHighlightingCurrentScan && e.ctrlKey) {
            let [mz, rt] = GraphUtil.getMzRtCoordinate(e);
            let nearestRt = GraphUtil.findNearestRt(rt);
            if (nearestRt >= 0) {
                Graph.curRT = nearestRt;
                GraphData.drawCurrentScanMarker();
                GraphRender.renderImmediate();
            }
        }
    });
};
GraphInit.createRedrawEvent = () => {
    //listener for rt range and mz range change in 3d graph
    let redrawRequestButton = document.getElementById('request3dGraphRedraw');
    if (!redrawRequestButton) {
        console.error("cannot find button 'request3dGraphRedraw'");
        return;
    }
    redrawRequestButton.addEventListener('click', function () {
        let centerRtBox = document.querySelector("#rtRangeMin");
        let rangeRTBox = document.querySelector("#rtRangeMax");
        let centerMZBox = document.querySelector("#mzRangeMin");
        let rangeMZBox = document.querySelector("#mzRangeMax");
        let inteCutoffBox = document.querySelector("#cutoff-threshold");
        if (!centerRtBox || !rangeRTBox) {
            console.error("range text boxes for RT don't exist");
            return;
        }
        if (!centerMZBox || !rangeMZBox) {
            console.error("mz text boxes for MZ don't exist");
            return;
        }
        if (!inteCutoffBox) {
            console.error("text boxe for intensity cutoff doesn't exist");
            return;
        }
        let centerRT = parseFloat(centerRtBox.value);
        let rangeRT = parseFloat(rangeRTBox.value);
        let centerMZ = parseFloat(centerMZBox.value);
        let rangeMZ = parseFloat(rangeMZBox.value);
        let minRT = Graph.viewRange.rtmin;
        let maxRT = Graph.viewRange.rtmax;
        let minMZ = Graph.viewRange.mzmin;
        let maxMZ = Graph.viewRange.mzmax;
        if (!isNaN(centerRT) && !isNaN(rangeRT)) {
            minRT = centerRT - rangeRT;
            maxRT = centerRT + rangeRT;
        }
        if (!isNaN(centerMZ) && !isNaN(rangeMZ)) {
            minMZ = centerMZ - rangeMZ;
            maxMZ = centerMZ + rangeMZ;
        }
        /*if (!isNaN(centerRT) || !isNaN(rangeRT)) {//if at least one value is given for RT
          if (!isNaN(centerRT) && !isNaN(rangeRT)) {
            minRT = centerRT - rangeRT;
            maxRT = centerRT + rangeRT;
          } else if (!isNaN(centerRT)) {
            let prevRange = (maxRT - minRT) / 2 - minRT
            minRT = centerRT - prevRange;
            maxRT = centerRT + prevRange;
          } else if (!isNaN(rangeRT)) {
            let prevCenter = (maxRT - minRT) / 2;
            minRT = prevCenter - rangeRT;
            maxRT = prevCenter + rangeRT;
          }
        }
  
        if (!isNaN(centerMZ) || !isNaN(rangeMZ)) {//if at least one value is given for RT
          if (!isNaN(centerMZ) && !isNaN(rangeMZ)) {
            minMZ = centerMZ - rangeMZ;
            maxMZ = centerMZ + rangeMZ;
          } else if (!isNaN(centerMZ)) {
            let prevRange = (maxMZ - minMZ) / 2 - minMZ
            minMZ = centerMZ - prevRange;
            maxMZ = centerMZ + prevRange;
          } else if (!isNaN(rangeMZ)) {
            let prevCenter = (maxMZ - minMZ) / 2;
            minMZ = prevCenter - rangeMZ;
            maxMZ = prevCenter + rangeMZ;
          }
        }*/
        /*if (isNaN(centerMZ) && isNaN(centerRT)) {}//don't change current range
        else {
          if (isNaN(centerRT)) {//center not given, then whether range data is given or not, keep the current view range
            centerRT = (Graph.viewRange.rtmin + Graph.viewRange.rtmax) / 2;
            minRT = Graph.viewRange.mzmin;
            maxRT = Graph.viewRange.mzmax;
          } else {
            if (!isNaN(rangeRT)) {//center given, range given.
              minRT = centerRT - rangeRT;
              maxRT = centerRT + rangeRT;
            } else {//center not given, range given
              centerRT = (Graph.viewRange.rtmin + Graph.viewRange.rtmax) / 2;
              minRT = centerRT - rangeRT;
              maxRT = centerRT + rangeRT;
            }
          }
        }*/
        //error handing
        if (minRT > maxRT) {
            alert("Invalid Range : Minimum retention time is bigger than maximum.");
        }
        else if (minMZ > maxMZ) {
            alert("Invalid Range : Minimum m/z is bigger than maximum");
        }
        else if (isNaN(+inteCutoffBox.value)) {
            alert("Invalid Cutoff Value: Enter a valid number");
        }
        else {
            GraphData.updateGraph(minMZ, maxMZ, minRT, maxRT, Graph.curRT);
        }
    }, false);
};
GraphInit.createEventHandlers = () => {
    GraphInit.createRedrawEvent();
    GraphInit.createSaveGraphEvent();
};
/******** CREATE GRAPH ELEMENTS ******/
// returns a 1x1 unit grid, GRID_RANGE units long in the x and z dimension
GraphInit.createAxis = () => {
    //@ts-ignore //Three.Geometry does exists
    let xAxisGeo = new THREE.Geometry();
    //@ts-ignore //Three.Geometry does exists
    let yAxisGeo = new THREE.Geometry();
    //@ts-ignore //Three.Geometry does exists
    let xAxisSubGeo = new THREE.Geometry(); //these two axes are not the main axes -- for zoom purpose only
    //@ts-ignore //Three.Geometry does exists
    let yAxisSubGeo = new THREE.Geometry();
    let axisMaterial = new THREE.LineBasicMaterial({ color: Graph.gridColor });
    yAxisGeo.vertices.push(new THREE.Vector3(0, 0, Graph.gridRange));
    yAxisGeo.vertices.push(new THREE.Vector3(0, 0, 0));
    yAxisSubGeo.vertices.push(new THREE.Vector3(Graph.gridRange, 0, Graph.gridRange));
    yAxisSubGeo.vertices.push(new THREE.Vector3(Graph.gridRange, 0, 0));
    xAxisGeo.vertices.push(new THREE.Vector3(Graph.gridRange, 0, Graph.gridRange));
    xAxisGeo.vertices.push(new THREE.Vector3(0, 0, Graph.gridRange));
    xAxisSubGeo.vertices.push(new THREE.Vector3(Graph.gridRange, 0, 0));
    xAxisSubGeo.vertices.push(new THREE.Vector3(0, 0, 0));
    let xAxis = new THREE.LineSegments(xAxisGeo, axisMaterial);
    let yAxis = new THREE.LineSegments(yAxisGeo, axisMaterial);
    let xAxisSub = new THREE.LineSegments(xAxisSubGeo, axisMaterial);
    let yAxisSub = new THREE.LineSegments(yAxisSubGeo, axisMaterial);
    xAxis.name = "xAxis";
    yAxis.name = "yAxis";
    xAxisSub.name = "xAxis";
    yAxisSub.name = "yAxis";
    Graph.axisGroup.add(xAxis);
    Graph.axisGroup.add(yAxis);
    Graph.axisGroup.add(xAxisSub);
    Graph.axisGroup.add(yAxisSub);
};
GraphInit.createGrid = () => {
    let y = 0;
    let gridmaterial = new THREE.LineBasicMaterial({ color: Graph.gridColor });
    for (let i = 0; i <= Graph.gridRange; i++) {
        let points = [];
        points.push(new THREE.Vector3(i, y, 0));
        points.push(new THREE.Vector3(i, y, Graph.gridRange));
        points.push(new THREE.Vector3(0, y, i));
        points.push(new THREE.Vector3(Graph.gridRange, y, i));
        let gridgeo = new THREE.BufferGeometry().setFromPoints(points);
        Graph.gridGroup.add(new THREE.LineSegments(gridgeo, gridmaterial));
    }
};
GraphInit.createPlane = () => {
    let surfaceGeo = new THREE.PlaneGeometry(Graph.gridRange, Graph.gridRange);
    let surfaceMat = new THREE.MeshBasicMaterial({ color: Graph.surfaceColor, side: THREE.DoubleSide });
    let surface = new THREE.Mesh(surfaceGeo, surfaceMat);
    surface.rotateX(Math.PI / 2);
    surface.position.set(Graph.gridRange / 2, -0.05, Graph.gridRange / 2);
    Graph.gridGroup.add(surface);
    GraphInit.createGrid();
};
/*static initColorSet = (): void => {
  //pick peak color based on each peak intensity -- currently 5 levels gradient
  let intRange: number = Graph.configData[0].INTMAX - Graph.configData[0].INTMIN;
      
  for (let i = 1; i <= Graph.gradientColor.length; i++) {
    let val = Graph.configData[0].INTMIN + Math.pow(intRange, i/Graph.gradientColor.length);
    Graph.cutoff.push(val);
  }
}*/
GraphInit.initRenderer = () => {
    if (!Graph.graphEl) {
        console.error("graph element doesn't exist");
        return;
    }
    Graph.renderer.setPixelRatio(window.devicePixelRatio);
    Graph.renderer.setSize(window.innerWidth, window.innerHeight * 0.6);
    Graph.renderer.setClearColor(0xEEEEEE, 1);
    Graph.renderer.domElement.id = "canvas3D";
    Graph.graphEl.appendChild(Graph.renderer.domElement);
};
GraphInit.initCamera = () => {
    Graph.camera.position.set(15, 15, 30);
};
GraphInit.initGraphControl = () => {
    /*initiate graph interactions*/
    let zoomObj = new GraphZoom();
    zoomObj.main();
    let panObj = new GraphPan();
    panObj.main();
    let hoverObj = new HoverFeature();
    hoverObj.main();
    let hoverPoint = new HoverPosition();
    hoverPoint.main();
    let graphResize = new GraphResize();
    graphResize.main();
    //let camera: THREE.OrthographicCamera = Graph.camera;
    //let renderer: THREE.WebGLRenderer = Graph.renderer;
    /*right-click rotation controls*/
    Graph.graphControls.mouseButtons = { ORBIT: THREE.MOUSE.RIGHT };
    Graph.graphControls.addEventListener('change', GraphRender.checkAndRender.bind(Graph));
    Graph.graphControls.target.set(Graph.gridRange / 2, 0, Graph.gridRange / 2); // focus on the center of the grid
    Graph.graphControls.enablePan = false;
    Graph.graphControls.enableZoom = false;
    Graph.graphControls.enabled = true;
};
GraphInit.initScene = () => {
    GraphInit.initRenderer();
    GraphInit.initCamera();
    // rendering element
    window.addEventListener("resize", GraphControl.resizeCamera);
    GraphControl.resizeCamera();
};
GraphInit.main = (scanId) => {
    GraphInit.initScene();
    GraphInit.initGraphControl();
    GraphInit.createPlane();
    GraphInit.createAxis();
    GraphInit.createEventHandlers();
    GraphInit.createSwitchCurrentScan();
    UploadMzrt.main();
    GraphData.drawFullRangeGraph(scanId);
    Graph.renderer.setAnimationLoop(function () {
        Graph.graphControls.update();
    });
};
