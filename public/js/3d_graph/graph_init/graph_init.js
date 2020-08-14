/*graph_init.js: class for initializing 3d graph*/
class GraphInit{

    constructor(graphEl, dataRange){
        this.graphEl = graphEl;
        this.dataRange = dataRange;
    }
     
    /******** CREATE GRAPH ELEMENTS ******/
    // returns a 1x1 unit grid, GRID_RANGE units long in the x and z dimension
    createGrid() {
        let y = 0;
        let gridgeo = new THREE.Geometry();
        let gridmaterial = new THREE.LineBasicMaterial({ color: Graph.gridColor });

        for (let i = 0; i <= Graph.gridRange; i++) {
            gridgeo.vertices.push(new THREE.Vector3(i, y, 0));
            gridgeo.vertices.push(new THREE.Vector3(i, y, Graph.gridRange));

            gridgeo.vertices.push(new THREE.Vector3(0, y, i));
            gridgeo.vertices.push(new THREE.Vector3(Graph.gridRange, y, i));
        }

        gridgeo.vertices.push(new THREE.Vector3(0, y, Graph.gridRange));
        gridgeo.vertices.push(new THREE.Vector3(0, 0, Graph.gridRange));

        return new THREE.LineSegments(gridgeo, gridmaterial);
    }
    createPlane(){
        let surfaceGeo = new THREE.PlaneGeometry(Graph.gridRange, Graph.gridRange);
        let surfaceMat = new THREE.MeshBasicMaterial({ color: Graph.surfaceColor, side: THREE.DoubleSide });
        let surface = new THREE.Mesh(surfaceGeo, surfaceMat);
        surface.rotateX(Math.PI/2);
        surface.position.set(Graph.gridRange / 2, -0.05, Graph.gridRange / 2);
        Graph.gridgroup.add(surface);
        Graph.gridgroup.add(this.createGrid());
    }
    initColorSet(){
        //pick peak color based on each peak intensity -- currently 5 levels gradient
        let intRange = this.dataRange.intmax - this.dataRange.intmin;
  
        for (let i = 1; i <= Graph.gradientColor.length; i++)
        {
            let val = this.dataRange.intmin + Math.pow(intRange, i/Graph.gradientColor.length);
            //console.log("interval ", i, ": ", val);
            Graph.cutoff.push(val);
        } 
    }
    initRenderer(){
        Graph.renderer.setPixelRatio( window.devicePixelRatio );
        Graph.renderer.setSize(window.innerWidth, window.innerHeight * 0.3);
        Graph.renderer.setClearColor(0xEEEEEE, 1);
        Graph.renderer.domElement.id = "canvas3D";
        this.graphEl.appendChild(Graph.renderer.domElement);
    }
    initCamera(){
        Graph.camera.position.set(15, 15, 30);
    }
    initGraphControl(){
        /*initiate graph interactions*/
        //GraphZoom.init(parent);//can be a static method
        let panObj = new GraphPan();
        panObj.init(Graph.scene);

        let camera = Graph.camera;
        let renderer = Graph.renderer;

        /*right-click rotation controls*/
        Graph.graphControls = new THREE.OrbitControls( camera, renderer.domElement );
        Graph.graphControls.mouseButtons = { ORBIT: THREE.MOUSE.RIGHT };
        Graph.graphControls.addEventListener( 'change', GraphRender.renderImmediate.bind(Graph));
        Graph.graphControls.target.set(Graph.gridRange/2, 0, Graph.gridRange/2); // focus on the center of the grid
        Graph.graphControls.enablePan = false;
        Graph.graphControls.enabled = true;
    }
    initScene(){
        this.initRenderer();
        this.initCamera();
        // rendering element
        window.addEventListener("resize", GraphControl.resizeCamera);
        GraphControl.resizeCamera(this.graphEl);
    }
    init(){
        this.initScene();
        this.initColorSet();
        this.initGraphControl();
        this.createPlane();

        Graph.scene.add(Graph.gridgroup);
        Graph.scene.add(Graph.datagroup);
        Graph.scene.add(Graph.labelgroup);
        Graph.scene.add(Graph.ticklabelgroup);
        Graph.scene.add(Graph.markergroup);
        Graph.scene.add(Graph.featuregroup);
    
        GraphControl.updateViewRange(this.dataRange);

        Graph.renderer.setAnimationLoop(function() {
            Graph.graphControls.update();
        })
    }
}