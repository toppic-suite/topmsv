/*graph_init.js: class for initializing 3d graph*/
class GraphInit{
    constructor(){}
     
    /******** GRAPH EVENTS******/
    static createSaveGraphEvent = () => {//add an event listener for when a user clicks on graph download button
        document.getElementById("save3dGraph").addEventListener("click", GraphDownload.save3dGraph, false);
    }
    static createRedrawEvent = () => {
        //listener for rt range and mz range change in 3d graph
        let redrawRequestButton = document.getElementById('request3dGraphRedraw');

        redrawRequestButton.addEventListener('click', function(){
            let minRT = parseFloat(document.getElementById('rtRangeMin').value) * 60;//unit is different in DB
            let maxRT = parseFloat(document.getElementById('rtRangeMax').value) * 60;
            let minMZ = parseFloat(document.getElementById('mzRangeMin').value);
            let maxMZ = parseFloat(document.getElementById('mzRangeMax').value);
            let inteCutoff = parseFloat(document.getElementById("cutoff-threshold").value);

            //error handing
            if (minRT > maxRT){
                alert("Invalid Range : Minimum retention time is bigger than maximum.");
            } 
            if (minMZ > maxMZ){
                alert("Invalid Range : Minimum m/z is bigger than maximum");
            }
            if (isNaN(minRT) || isNaN(maxRT) || isNaN(minMZ) || isNaN(maxMZ)){
                alert("Invalid Value Found : Please make sure the range has valid values.");
            }
            if (isNaN(inteCutoff)) {
                alert("Invalid Value Found : Please enter a valid value for intensity cutoff threshold");
            }
            else{
                GraphData.updateGraph(minMZ, maxMZ, minRT, maxRT, Graph.curRT, false);
            }
        }, false);
    }
    /******** CREATE GRAPH ELEMENTS ******/
    // returns a 1x1 unit grid, GRID_RANGE units long in the x and z dimension
    static createAxis = () => {
        let xAxisGeo = new THREE.Geometry();
        let yAxisGeo = new THREE.Geometry();
        let xAxisSubGeo = new THREE.Geometry();//these two axes are not the main axes -- for zoom purpose only
        let yAxisSubGeo = new THREE.Geometry();

        let axisMaterial = new THREE.LineBasicMaterial({ color:Graph.gridColor });

        yAxisGeo.vertices.push(new THREE.Vector3(0, 0, Graph.gridRange));
        yAxisGeo.vertices.push(new THREE.Vector3(0, 0, 0));

        yAxisSubGeo.vertices.push(new THREE.Vector3(Graph.gridRange, 0, Graph.gridRange));
        yAxisSubGeo.vertices.push(new THREE.Vector3(Graph.gridRange, 0, 0));
        
        xAxisGeo.vertices.push(new THREE.Vector3(Graph.gridRange,0, Graph.gridRange));
        xAxisGeo.vertices.push(new THREE.Vector3(0, 0, Graph.gridRange));

        xAxisSubGeo.vertices.push(new THREE.Vector3(Graph.gridRange,0, 0));
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
    }
    static createGrid = () => {
        let y = 0;
        
        let gridmaterial = new THREE.LineBasicMaterial({ color:Graph.gridColor });
        
        for (let i = 0; i <= Graph.gridRange; i++) {           
           let points = [];
           points.push(new THREE.Vector3(i, y, 0));
           points.push(new THREE.Vector3(i, y, Graph.gridRange));
           points.push(new THREE.Vector3(0, y, i));
           points.push(new THREE.Vector3(Graph.gridRange, y, i));

           let gridgeo = new THREE.BufferGeometry().setFromPoints(points);
           Graph.gridGroup.add(new THREE.LineSegments(gridgeo, gridmaterial));
        }
    }
    static createPlane = () => {
        let surfaceGeo = new THREE.PlaneGeometry(Graph.gridRange, Graph.gridRange);
        let surfaceMat = new THREE.MeshBasicMaterial({ color: Graph.surfaceColor, side: THREE.DoubleSide });
        let surface = new THREE.Mesh(surfaceGeo, surfaceMat);

        surface.rotateX(Math.PI/2);
        surface.position.set(Graph.gridRange / 2, -0.05, Graph.gridRange / 2);

        Graph.gridGroup.add(surface);
        GraphInit.createGrid();
    }
    static initColorSet = () => {
        //pick peak color based on each peak intensity -- currently 5 levels gradient
        let intRange = Graph.configData[0].INTMAX - Graph.configData[0].INTMIN;
        
        for (let i = 1; i <= Graph.gradientColor.length; i++)
        {
            let val = Graph.configData[0].INTMIN + Math.pow(intRange, i/Graph.gradientColor.length);
            Graph.cutoff.push(val);
        } 
    }
    static initRenderer = () => {
        Graph.renderer.setPixelRatio( window.devicePixelRatio );
        Graph.renderer.setSize(window.innerWidth, window.innerHeight * 0.6);
        Graph.renderer.setClearColor(0xEEEEEE, 1);
        Graph.renderer.domElement.id = "canvas3D";
        Graph.graphEl.appendChild(Graph.renderer.domElement);
    }
    static initCamera = () => {
        Graph.camera.position.set(15, 15, 30);
    }
    static initGraphControl = () => {
        /*initiate graph interactions*/
        let zoomObj = new GraphZoom();
        zoomObj.main(Graph.scene);

        let panObj = new GraphPan();
        panObj.main();

        let hoverObj = new HoverFeature();
        hoverObj.main();

        let hoverPoint = new HoverPosition();
        hoverPoint.main();

        let graphResize = new GraphResize();
        graphResize.main();

        let camera = Graph.camera;
        let renderer = Graph.renderer;

        /*right-click rotation controls*/
        Graph.graphControls = new THREE.OrbitControls( camera, renderer.domElement );
        Graph.graphControls.mouseButtons = { ORBIT: THREE.MOUSE.RIGHT };
        Graph.graphControls.addEventListener( 'change', GraphRender.checkAndRender.bind(Graph));
        Graph.graphControls.target.set(Graph.gridRange/2, 0, Graph.gridRange/2); // focus on the center of the grid
        Graph.graphControls.enablePan = false;
        Graph.graphControls.enableZoom = false;
        Graph.graphControls.enabled = true;
    }
    static initScene = () => {
        GraphInit.initRenderer();
        GraphInit.initCamera();
        // rendering element
        window.addEventListener("resize", GraphControl.resizeCamera);
        GraphControl.resizeCamera();
    }
    static main = (mzmin, mzmax, curRT) => {
        GraphInit.initScene();
        GraphInit.initGraphControl();

        GraphInit.createPlane();
        GraphInit.createAxis();
        GraphInit.createRedrawEvent();
        GraphInit.createSaveGraphEvent();
        
        UploadMzrt.main();
        
        GraphData.drawInitGraph(mzmin, mzmax, curRT);
        
        Graph.renderer.setAnimationLoop(function() {
            Graph.graphControls.update();
        })
    }
}
