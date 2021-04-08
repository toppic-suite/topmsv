// graph.js: set properties of 3D graph which are referenced and updated from other classes throughout the application
//and call to initialize empty 3D graph

class Graph{
    constructor(projectDir){
        Graph.graphEl = document.querySelector("#graph-container"); 
        Graph.projectDir = projectDir;
    }
    setProperties = () => {
        /*default m/z range when scan changes*/
        Graph.defaultMinMz = 550;
        Graph.defaultMaxMz = 1000;
        
        /*graph and grid size*/
        Graph.gridRange = 20;
        Graph.gridRangeVertical = 6;
        Graph.viewSize = 25; // in world units; large enough to fit the graph and labels at reasonable angles

        /*initialize graph components*/
        Graph.scene = new THREE.Scene();
        Graph.renderer = new THREE.WebGLRenderer( { antialias: true, alpha:true} );
        Graph.camera = new THREE.OrthographicCamera( 1, 1, 1, 1, 0, 50 );
        Graph.graphPlane = new THREE.Plane(new THREE.Vector3(0,1,0), 0);
        
        /*rounding for grpah axis labels */
        Graph.roundMz = 3;
        Graph.roundRt = 3;

        /*on scaling and repositioning objects*/
        Graph.rangeTransform = new THREE.Vector3(1/Graph.gridRange, 1/Graph.gridRangeVertical, 1/Graph.gridRange);

        /*initial data range -- to be replaced with incoming data*/
        Graph.dataRange = {};
        Graph.viewRange = {};

        Graph.rtRange = 30;
        Graph.curRT = -1;
        Graph.scanID = 1;
        
        /*metadata and data control*/
        Graph.minPeakHeight = 0.05;
        Graph.maxPeakHeight = 50;
        Graph.maxPeaks = 2000;
        Graph.currentData = [];//current peak data on the 3d graph

        Graph.intensitySum = 0;

        /*for downloading 3d graph*/
        Graph.imageAddress;

        /*color set for peaks */
        Graph.cutoff = []; //intensity cutoff point for each color in gradient

        Graph.currentScanColor = "#ff5797";
        Graph.surfaceColor = "#000030";
        Graph.gridColor = "#555555";
        Graph.featureColor = "#a8b5ff";

        /*whether to plot cylinder or line*/
        Graph.isPerpendicular = false;

        /*whether to call functions for plotting feature anno. */
        Graph.isFeatureAnnotated = false;

        /*whether to highlight current scan*/
        Graph.isCurrentHighlighted = false;

        /*whether to update values in the text box*/
        Graph.isUpdateTextBox = true;
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
        return new Promise(function(resolve, reject){
            let promise = LoadData.getConfigData();
    
            promise.then(configData => {//configData[0] contains the metadata about the entire mzML file (max m/z, max retention time, peakCount...)

                Graph.dataRange.rtmax = configData[0].RTMAX;
                Graph.dataRange.rtmin = configData[0].RTMIN;
                Graph.dataRange.intmax = configData[0].INTMAX;
                Graph.dataRange.intmin = configData[0].INTMIN;
                Graph.dataRange.mzmax = configData[0].MZMAX;
                Graph.dataRange.mzmin = configData[0].MZMIN;  
                
                Graph.configData = configData;
                
                resolve();
    
            }, function(err){
                console.log(err);
            }) 
        })
    }
    setInitScale = () => {
        let plotGroup = Graph.scene.getObjectByName("plotGroup");
        let scale = Graph.maxPeakHeight / Graph.dataRange.intmax;
        plotGroup.scale.set(plotGroup.scale.x, scale, plotGroup.scale.z);
    }
    main = (mzmin, mzmax, scanNum) => {
        this.setProperties();
        this.createGroups();
        let promise = this.initDataRange();

        promise.then(()=>{
            this.setInitScale();
            GraphInit.main(mzmin, mzmax, scanNum);
        })
    }
}