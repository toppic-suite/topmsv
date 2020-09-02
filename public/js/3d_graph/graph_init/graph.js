// graph.js: set properties of 3D graph which are referenced and updated from other classes throughout the application
//and call to initialize empty 3D graph

class Graph{
    constructor(graphEl, tableData){
        Graph.graphEl = graphEl; 
        Graph.tablePeakCount = tableData;
    }
    setProperties = () => {
        /*add properties to Graph class*/
        Graph.gridRange = 20;
        Graph.gridRangeVertical = 6;
        Graph.viewSize = 18; // in world units; large enough to fit the graph and labels at reasonable angles

        /*initialize graph components*/
        Graph.scene = new THREE.Scene();
        Graph.renderer = new THREE.WebGLRenderer( { antialias: true, alpha:true} );
        Graph.camera = new THREE.OrthographicCamera( 5000, 5000, 5000, 5000, 0, 5000 );
        Graph.graphPlane = new THREE.Plane(new THREE.Vector3(0,1,0), 0);

        Graph.rulerTickes = 5;
        Graph.roundMz = 3;
        Graph.roundRt = 3;
        Graph.roundInte = 3;

        /*on scaling and repositioning objects*/
        Graph.rangeTransform = new THREE.Vector3(1/Graph.gridRange, 1/Graph.gridRangeVertical, 1/Graph.gridRange);

        /*initial data range -- to be replaced with incoming data*/
        Graph.dataRange = {};
        Graph.viewRange = {};

        Graph.rtRange = 30;
        Graph.curRT = -1;

        /*metadata and data control*/
        Graph.maxPeaks = 2000;
        Graph.currentData;//current peak data on the 3d graph

        Graph.intensitySum = 0;

        /*for downloading 3d graph*/
        Graph.imageAddress;

        /*color set for peaks */
        Graph.cutoff = []; //intensity cutoff point for each color in gradient

        Graph.currentScanColor = "#ff5797";
        //Graph.surfaceColor = "#eee";
        //Graph.gridColor = "#7a7a7a";
        Graph.surfaceColor = "#7a7a7a";
        Graph.gridColor = "#555555";
        Graph.featureColor = "#a8b5ff";

        /*for deciding whether to plot cylinder or line*/
        Graph.isPerpendicular = false;
    }
    createGroups = () => {
        /*groups to hold different graph elements */
        Graph.gridGroup = new THREE.Group();
        Graph.dataGroup = new THREE.Group();
        Graph.markerGroup = new THREE.Group();
        Graph.labelGroup = new THREE.Group();
        Graph.ticksGroup = new THREE.Group();
        Graph.ticklabelGroup = new THREE.Group();
        Graph.plotGroup = new THREE.Group();
        Graph.featureGroup = new THREE.Group();
        Graph.axisGroup = new THREE.Group();
        
        Graph.gridGroup.name = "gridGroup";
        Graph.dataGroup.name = "dataGroup";
        Graph.markerGroup.name = "markerGroup";
        Graph.labelGroup.name = "labelGroup";
        Graph.ticksGroup.name = "ticksGroup";
        Graph.ticklabelGroup.name = "tickLabelGroup";
        Graph.plotGroup.name = "plotGroup";
        Graph.featureGroup.name = "featureGroup";
        Graph.axisGroup.name = "axisGroup";

        Graph.dataGroup.add(Graph.plotGroup);
        Graph.dataGroup.add(Graph.ticksGroup);

        Graph.scene.add(Graph.gridGroup);
        Graph.scene.add(Graph.dataGroup);
        Graph.scene.add(Graph.labelGroup);
        Graph.scene.add(Graph.ticklabelGroup);
        Graph.scene.add(Graph.markerGroup);
        Graph.scene.add(Graph.featureGroup);
        Graph.scene.add(Graph.axisGroup);
    }
    initDataRange = () => {
        let dataTotal = Graph.tablePeakCount[0];

        Graph.dataRange.rtmax = dataTotal.RTMAX;
        Graph.dataRange.rtmin = dataTotal.RTMIN;
        Graph.dataRange.intmax = dataTotal.INTMAX;
        Graph.dataRange.intmin = dataTotal.INTMIN;
        Graph.dataRange.mzmax = dataTotal.MZMAX;
        Graph.dataRange.mzmin = dataTotal.MZMIN;    
    }
    main = () => {
        this.setProperties();
        this.createGroups();
        this.initDataRange();

        GraphInit.main();
    }
}