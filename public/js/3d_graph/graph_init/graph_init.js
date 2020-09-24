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

            //error handing
            if (minRT > maxRT){
                alert("Invalid Range : Minimum retention time is bigger than maximum.");
            } 
            else if (minMZ > maxMZ){
                alert("Invalid Range : Minimum m/z is bigger than maximum");
            }
            else if (isNaN(minRT) || isNaN(maxRT) || isNaN(minMZ) || isNaN(maxMZ)){
                alert("Invalid Value Found : Please make sure the range has valid values.");
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
        let axisMaterial = new THREE.LineBasicMaterial({ color:Graph.gridColor });

        yAxisGeo.vertices.push(new THREE.Vector3(0, 0, Graph.gridRange));
        yAxisGeo.vertices.push(new THREE.Vector3(0, 0, 0));

        xAxisGeo.vertices.push(new THREE.Vector3(Graph.gridRange,0, Graph.gridRange));
        xAxisGeo.vertices.push(new THREE.Vector3(0, 0, Graph.gridRange));

        let xAxis = new THREE.LineSegments(xAxisGeo, axisMaterial);
        let yAxis = new THREE.LineSegments(yAxisGeo, axisMaterial);

        xAxis.name = "xAxis";
        yAxis.name = "yAxis";
        
        Graph.axisGroup.add(xAxis);
        Graph.axisGroup.add(yAxis);
    }
    static createGrid = () => {
        let y = 0;
        let gridgeo = new THREE.Geometry();
        let gridmaterial = new THREE.LineBasicMaterial({ color:Graph.gridColor });

        for (let i = 0; i <= Graph.gridRange; i++) {
            gridgeo.vertices.push(new THREE.Vector3(i, y, 0));
            gridgeo.vertices.push(new THREE.Vector3(i, y, Graph.gridRange));

            gridgeo.vertices.push(new THREE.Vector3(0, y, i));
            gridgeo.vertices.push(new THREE.Vector3(Graph.gridRange, y, i));
        }
        return new THREE.LineSegments(gridgeo, gridmaterial);
    }
    static createPlane = () => {
        let surfaceGeo = new THREE.PlaneGeometry(Graph.gridRange, Graph.gridRange);
        let surfaceMat = new THREE.MeshBasicMaterial({ color: Graph.surfaceColor, side: THREE.DoubleSide });
        let surface = new THREE.Mesh(surfaceGeo, surfaceMat);

        surface.rotateX(Math.PI/2);
        surface.position.set(Graph.gridRange / 2, -0.05, Graph.gridRange / 2);

        Graph.gridGroup.add(surface);
        Graph.gridGroup.add(GraphInit.createGrid());
    }
    static initColorSet = () => {
        //pick peak color based on each peak intensity -- currently 5 levels gradient
        let intRange = Graph.tablePeakCount[0].INTMAX - Graph.tablePeakCount[0].INTMIN;
        
        for (let i = 1; i <= Graph.gradientColor.length; i++)
        {
            let val = Graph.tablePeakCount[0].INTMIN + Math.pow(intRange, i/Graph.gradientColor.length);
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
    static main = (mzmin, mzmax, scanNum) => {
        GraphInit.initScene();
        GraphInit.initGraphControl();

        GraphInit.createPlane();
        GraphInit.createAxis();
        GraphInit.createRedrawEvent();
        GraphInit.createSaveGraphEvent();
        
        GraphData.drawInitGraph(mzmin, mzmax, scanNum);
        
        Graph.renderer.setAnimationLoop(function() {
            Graph.graphControls.update();
        })
    }
}
