// graph.js: set properties of 3D graph which are referenced and updated from other classes throughout the application
//and initialize empty 3D graph

class Graph{
    constructor(graphEl, tableData){
        Graph.graphEl = graphEl; 
        Graph.tablePeakCount = tableData;
    }
    setProperties(){
        /*add static properties to Graph class*/
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
        Graph.gradientColor =  ["#000aff", "#033be3", "#076cc7", "#0a9dab", "#0ed88a", "#11ff74", "#33fc61", "#5ef94a", "#89f633", "#abf320", "#e6ef00", "#eae503", "#efd807", "#f4ca0a", "#fabd0e", "#ffaf11", "#ff8c0e", "#ff690b", "#ff4607", "#ff2a04", "#ff0000" ];
        Graph.cutoff = []; //intensity cutoff point for each color in gradient

        Graph.currentScanColor = "#ff5797";
        Graph.surfaceColor = "#555555";
        Graph.gridColor = "#7a7a7a";
        Graph.featureColor = "#a8b5ff";
    }
    createGroups(){
        /*groups to hold different graph elements */
        Graph.gridgroup = new THREE.Group();
        Graph.datagroup = new THREE.Group();
        Graph.markergroup = new THREE.Group();
        Graph.labelgroup = new THREE.Group();
        Graph.ticksGroup = new THREE.Group();
        Graph.ticklabelgroup = new THREE.Group();
        Graph.plotGroup = new THREE.Group();
        Graph.featuregroup = new THREE.Group();
        Graph.axisgroup = new THREE.Group();
        
        Graph.gridgroup.name = "gridGroup";
        Graph.datagroup.name = "dataGroup";
        Graph.markergroup.name = "markerGroup";
        Graph.labelgroup.name = "labelGroup";
        Graph.ticksGroup.name = "ticksGroup";
        Graph.ticklabelgroup.name = "tickLabelGroup";
        Graph.plotGroup.name = "plotGroup";
        Graph.featuregroup.name = "featureGroup";
        Graph.axisgroup.name = "axisGroup";

        /*plotting objects*/

        Graph.datagroup.add(Graph.plotGroup);
        Graph.datagroup.add(Graph.ticksGroup);

        Graph.scene.add(Graph.gridgroup);
        Graph.scene.add(Graph.datagroup);
        Graph.scene.add(Graph.labelgroup);
        Graph.scene.add(Graph.ticklabelgroup);
        Graph.scene.add(Graph.markergroup);
        Graph.scene.add(Graph.featuregroup);
        Graph.scene.add(Graph.axisgroup);
    }
    initDataRange(){
        let dataTotal = Graph.tablePeakCount[0];

        Graph.dataRange.rtmax = dataTotal.RTMAX;
        Graph.dataRange.rtmin = dataTotal.RTMIN;
        Graph.dataRange.intmax = dataTotal.INTMAX;
        Graph.dataRange.intmin = dataTotal.INTMIN;
        Graph.dataRange.mzmax = dataTotal.MZMAX;
        Graph.dataRange.mzmin = dataTotal.MZMIN;    
    }
    main(){
        this.setProperties();
        this.createGroups();
        this.initDataRange();

        let graphInit = new GraphInit();
        graphInit.init();
    }
}