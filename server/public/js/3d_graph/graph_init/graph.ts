// graph.js: set properties of 3D graph which are referenced and updated from other classes throughout the application
//and call to initialize empty 3D graph
import {Scene, WebGLRenderer, DoubleSide, OrthographicCamera, Plane, Vector3, Group, BufferGeometry, BufferAttribute, Line, LineBasicMaterial, LineDashedMaterial} from '../../../lib/js/three.module.js';
import {OrbitControls} from '../../../lib/js/OrbitControls.js';
import {GraphInit} from './graph_init.js';
import {GraphUtil} from '../graph_util/graph_util.js';
import {LoadData} from '../graph_data/load_data.js';
import {showFeatureTable} from '../../result_page/feature_table.js';

export class Graph{
  /*default m/z range when scan changes*/
  static defaultMinMz: number = 550;
  static defaultMaxMz: number = 1000;
      
  /*graph and grid size*/
  static gridRange: number = 20;
  static gridRangeVertical: number = 6;
  static viewSize: number = 25; // in world units; large enough to fit the graph and labels at reasonable angles

  /*initialize graph components*/
  static scene: Scene = new Scene();
  static renderer: WebGLRenderer = new WebGLRenderer( { antialias: true, alpha:true} );
  static camera: OrthographicCamera = new OrthographicCamera( -50, 50, -10, 10, 1, 100 );
  static graphPlane: Plane = new Plane(new Vector3(0,1,0), 0);
  static graphControls: OrbitControls = new OrbitControls(Graph.camera, Graph.renderer.domElement );

  /*rounding for grpah axis labels */
  static roundMz: number = 3;
  static roundRt: number = 3;

  /*on scaling and repositioning objects*/
  static rangeTransform: Vector3 = new Vector3(1/Graph.gridRange, 1/Graph.gridRangeVertical, 1/Graph.gridRange);
  static peakScale: number = 0;
  static intSquish: number = 1;//store previous int_squish
        
  /*initial data range -- to be replaced with incoming data*/
  static dataRange: Range3DView = {} as Range3DView;
  static viewRange: Range3DView = {} as Range3DView;

  static rtRange: number = 30/60;
  static curRT: number = -1;
  static scanID: number = 1;
        
  /*metadata and data control*/
  static minPeakHeight: number = 0.1;
  static maxPeakHeight: number = 15;
  static maxPeaks: number = 4000;
  static maxFeature: number = Graph.maxPeaks / 2;

  static intensitySum = 0;
  static intensitySumTotal = -1;

  /*for downloading 3d graph*/
  static imageAddress;

  /*color set for peaks */
  static cutoff = []; //intensity cutoff point for each color in gradient

  static currentScanColor = "#ff5797";
  static surfaceColor = "#000030";
  static gridColor = "#555555";
  static featureColor = "#a8b5ff";

  static peakColor = {//7 colors total
    "0": "#0000ff",
    "1": "#007fff",
    "2": "#00ffff",
    "3": "#7fff7f",
    "4": "#ffff00",
    "5": "#ff7f00",
    "6": "#ff0000"
  };

  /*whether to plot cylinder or line*/
  static isPerpendicular = false;

  /*whether to call functions for plotting feature anno. */
  static isFeatureAnnotated = false;

  /*whether to highlight current scan*/
  static isHighlightingCurrentScan = false;

  /*whether to update values in the text box*/
  static isUpdateTextBox = true;

  /*whether redraw is triggered by pan or zoom - determines whether peak inte is adjusted or not*/
  static isPan = false;
  static isZoom = false;

  /*related to tick drawing */
  static xTickNum = 10;
  static yTickNum = 10;
  static tickWidthList = [10000,8000,6000,5000,4000,3000,2000,1000,800,700,600,500,450,400,350,300,250,200,150,100,50,20,10,5,3,2,1,0.5,0.2,0.1,0.05,0.01,0.005,0.001,0.0005,0.0001,0.00005,0.00001,0.000005,0.000001];
  static tickHeightList = [50,40,30,25,20,15,10,5,3,2,1,0.5,0.2,0.1,0.05,0.01,0.005,0.001,0.0005,0.0001,0.00005,0.00001,0.000005,0.000001];
  static xScale = 0.35;
  static yScale = 0.35;

  /*control height of feature annotation*/
  static featurePadding = 0.001;

  /*number of scans to show alongside the selected scan*/
  static scanDisplayed = 10;
  static ms1ScanCount = 0;
    
  static graphEl = document.querySelector("#graph-container"); 

  static projectDir;
  static resultViz;

  /*groups to hold different graph elements */
  static gridGroup = new Group();
  static dataGroup = new Group();
  static markerGroup = new Group();
  static labelGroup = new Group();
  static ticksGroup = new Group();
  static ticklabelGroup = new Group();
  static lineMeshGroup = new Group();//contains line * max peak number
  static plotGroup = new Group();// lines that are going to be plotted
  static peak2DGroup = new Group(); 
  static featureGroup = new Group();
  static axisGroup = new Group();

  static configData: ConfigData[] = [];
  static currentData: PeakDataDB[] = [];
  static currentFeatureData: FeatureDataDB[] = [];

  static resizedCamera;

  static lowInteScaleFactor = 1000;
  static lowInteThreshold = 0.005;//peaks will scale up if maxInt/intensitySumTotal is less than this number

  constructor(projectDir, resultViz, inteSum) {
    Graph.projectDir = projectDir;
    Graph.resultViz = resultViz;
    Graph.intensitySumTotal = inteSum;
  }

  initGroups = (): void => {
    Graph.gridGroup.name = "gridGroup";
    Graph.dataGroup.name = "dataGroup";
    Graph.markerGroup.name = "markerGroup";
    Graph.labelGroup.name = "labelGroup";
    Graph.ticksGroup.name = "ticksGroup";
    Graph.ticklabelGroup.name = "tickLabelGroup";
    Graph.lineMeshGroup.name = "lineMeshGroup";
    Graph.plotGroup.name = "plotGroup";
    Graph.peak2DGroup.name = "peak2DGroup";
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


  initMarkerGroup = (): void => {
    let linegeo: BufferGeometry = new BufferGeometry();
    linegeo.setAttribute("position", new BufferAttribute(new Float32Array([
        0, 0, 0,
        Graph.gridRange, 0, 0,
    ]), 3));

    let linemat: LineBasicMaterial = new LineBasicMaterial({color: Graph.currentScanColor});
    //linemat.polygonOffset = true;
    //linemat.polygonOffsetFactor = -0.1;

    let line: Line = new Line(linegeo, linemat);

    line["position"].set(0, 0, 0);
    line.visible = false;

    line.name = "currentScanMarker";

    Graph.markerGroup.add(line);
  }


  initFeatureGroup = (): void => {
    for (let i: number = 0; i < Graph.maxFeature; i++) {
      let geometry: BufferGeometry = new BufferGeometry();
      geometry.setAttribute("position", new BufferAttribute(new Float32Array([
            0, 0, 0,
            0, 0, 0,
            0, 0, 0,
            0, 0, 0,
            0, 0, 0,
        ]), 3));

      let linemat: LineDashedMaterial = new LineDashedMaterial( { side: DoubleSide, color: Graph.featureColor, dashSize: 0.01, gapSize: 0.005 } )
      let feature: Line = new Line( geometry, linemat );

      feature["position"].set(0, 0, 0);
      feature.name = "featureAnnotation";
      feature.visible = false;

      Graph.featureGroup.add(feature);
    }
  }


  init2DPlotGroup = (): void => {
    for (let i: number = 0; i < Graph.maxPeaks; i++) {
      let linegeo: BufferGeometry = new BufferGeometry();
      linegeo.setAttribute("position", new BufferAttribute(new Float32Array([
        0, 0, 0,
        0, 0, 0,
      ]), 3));
        
      let linemat = new LineBasicMaterial({color: "white", linewidth:0.8});
      let line: Line = new Line(linegeo, linemat);

      line["position"].set(0, 0, 0);
      line["mz"] = 0;
      line["rt"] = 0;
      line["int"] = 0;
      line["height"] = 0;
      line["name"] = "peak";
      line["scanID"] = 0;
      line.visible = false;

      Graph.peak2DGroup.add(line);
    }
  }


  initPlotGroup = (): void => {
    for (let i: number = 0; i < Graph.maxPeaks; i++) {
      let linegeo: BufferGeometry = new BufferGeometry();
      linegeo.setAttribute("position", new BufferAttribute(new Float32Array([
        0, 0, 0,
        0, 0.1, 0,
      ]), 3));
        
      let linemat: LineBasicMaterial = new LineBasicMaterial({color: "white"});
      let line: Line = new Line(linegeo, linemat);

      line["position"].set(0, 0, 0);
      line["mz"] = 0;
      line["rt"] = 0;
      line["int"] = 0;
      line["height"] = 0;
      line["name"] = "peak";
      line["scanID"] = 0;
      line.visible = false;

      Graph.plotGroup.add(line);
    }
  }


  initDataRange = (): Promise<void> => {
    return new Promise(function(resolve, reject){
      let promise: Promise<any> = LoadData.getConfigData();

      promise.then(configData => {//configData[0] contains the metadata about the entire mzML file (max m/z, max retention time, peakCount...)
        let configDataConverted: ConfigData[] = [];
        
        configData.forEach((configObj: any) => {
          for (const prop in configObj) {
            configObj[prop] = parseFloat(configObj[prop]);
          }
          configDataConverted.push(configObj);
        })
        Graph.dataRange.rtmax = configDataConverted[0].RTMAX;
        Graph.dataRange.rtmin = configDataConverted[0].RTMIN;
        Graph.dataRange.intmax = configDataConverted[0].INTMAX;
        Graph.dataRange.intmin = configDataConverted[0].INTMIN;
        Graph.dataRange.mzmax = configDataConverted[0].MZMAX;
        Graph.dataRange.mzmin = configDataConverted[0].MZMIN;
            
        Graph.configData = configDataConverted;
            
        resolve();
      }, function(err){
        console.log(err);
        reject();
      }) 
    })
  }


  setInitScale = (): void => {
    let plotGroup: Group | undefined = Graph.scene.getObjectByName("plotGroup");
    let scale: number = Graph.maxPeakHeight / Graph.dataRange.intmax;

    if (plotGroup) {
      plotGroup["scale"].set(plotGroup["scale"]["x"], scale, plotGroup["scale"]["z"]);
    } else {
      console.error("plotGroup does not exist");
    }
  }

  
  getScene = (): Scene => {
    return Graph.scene;
  }
    

  main = async (scanNum: number, isFullRange: boolean) => {
    this.initGroups();
    this.initPlotGroup();
    this.init2DPlotGroup();
    this.initFeatureGroup();
    this.initMarkerGroup();
    
    await this.initDataRange();
    await this.setInitScale();
    Graph.ms1ScanCount = parseFloat(await GraphUtil.getTotalScanCount());
    GraphInit.main(scanNum, isFullRange);

    if($('#featureStatus').val() !== "0"){
      let featureInfo: HTMLDivElement | null = document.querySelector<HTMLDivElement>("#featureInfo");
      if (featureInfo) {
        featureInfo.style.display = "inline-block";
        showFeatureTable();
      } else {
       console.error("Feature table doesn't exist"); 
      }
    }
  }
}