/*graph_init.js: class for initializing 3d graph*/
import {BufferGeometry, DoubleSide, LineBasicMaterial, Vector3, LineSegments, PlaneGeometry, Mesh, MeshBasicMaterial, MOUSE} from '../../../lib/js/three.module.js';
import {Graph} from './graph.js';
import {GraphUtil} from '../graph_util/graph_util.js';
import {GraphData} from '../graph_data/graph_data.js';
import {GraphRender} from '../graph_control/graph_render.js';
import {GraphControl} from '../graph_control/graph_control.js';
import {GraphDownload} from '../graph_util/graph_download.js';
import {GraphZoom} from '../graph_interaction/zoom_graph.js';
import {GraphPan} from '../graph_interaction/pan_graph.js';
import {HoverFeature} from '../graph_interaction/hover_feature.js';
import {HoverPosition} from '../graph_interaction/hover_position.js';
import {GraphResize} from '../graph_util/graph_resize.js';
import {UploadMzrt} from '../graph_data/upload_mzrt.js';

export class GraphInit{
  constructor(){}
     
  /******** GRAPH EVENTS******/
  static createSaveGraphEvent = (): void => {//add an event listener for when a user clicks on graph download button
    let save3dGraph: HTMLButtonElement | null = document.querySelector<HTMLButtonElement>("#save3dGraph");
    if (save3dGraph) {
      save3dGraph.addEventListener("click", GraphDownload.save3dGraph, false);
    } else {
      console.error("there is no button for saving 3d graph");
    }
  }


  static createSwitchCurrentScan = (): void => {
    let canvas3D: HTMLElement | null = document.getElementById("canvas3D");
    if (!canvas3D) {
      console.error("graph element doesn't exist");
      return;
    }
    //change current scan when clicked on 3d graph
    canvas3D.addEventListener("click", function(e: MouseEvent) {
      if (Graph.isHighlightingCurrentScan && e.ctrlKey) {
        let [mz, rt]: number[] = GraphUtil.getMzRtCoordinate(e);
        let nearestRt: number = GraphUtil.findNearestRt(rt);
        if (nearestRt >= 0) {
          Graph.curRT = nearestRt;
          GraphData.drawCurrentScanMarker();
          GraphRender.renderImmediate();
        }
      }
    })
  }


  static createRedrawEvent = (): void => {
    //listener for rt range and mz range change in 3d graph
    let redrawRequestButton: HTMLElement | null = document.getElementById('request3dGraphRedraw');

    if (!redrawRequestButton) {
      console.error("cannot find button 'request3dGraphRedraw'");
      return;
    }

    redrawRequestButton.addEventListener('click', function() {
      let centerRtBox: HTMLInputElement | null = document.querySelector<HTMLInputElement>("#rtRangeMin");
      let rangeRTBox: HTMLInputElement | null = document.querySelector<HTMLInputElement>("#rtRangeMax");
      let centerMZBox: HTMLInputElement | null = document.querySelector<HTMLInputElement>("#mzRangeMin");
      let rangeMZBox: HTMLInputElement | null = document.querySelector<HTMLInputElement>("#mzRangeMax");
      let inteCutoffBox: HTMLInputElement | null = document.querySelector<HTMLInputElement>("#cutoff-threshold");

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

      let centerRT: number = parseFloat(centerRtBox.value);
      let rangeRT: number = parseFloat(rangeRTBox.value);
      let centerMZ: number = parseFloat(centerMZBox.value);
      let rangeMZ: number = parseFloat(rangeMZBox.value);

      let minRT: number = Graph.viewRange.rtmin;
      let maxRT: number = Graph.viewRange.rtmax;
      let minMZ: number = Graph.viewRange.mzmin;
      let maxMZ: number = Graph.viewRange.mzmax;

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
      if (minRT > maxRT){
        alert("Invalid Range : Minimum retention time is bigger than maximum.");
      } else if (minMZ > maxMZ){
        alert("Invalid Range : Minimum m/z is bigger than maximum");
      } else if (isNaN(+inteCutoffBox.value)) {
        alert("Invalid Cutoff Value: Enter a valid number");
      } else{
        GraphData.updateGraph(minMZ, maxMZ, minRT, maxRT, Graph.curRT);
      }
    }, false);
  }
  
  
  static createEventHandlers = (): void => {
    GraphInit.createRedrawEvent();
    GraphInit.createSaveGraphEvent();
  }


  /******** CREATE GRAPH ELEMENTS ******/
  // returns a 1x1 unit grid, GRID_RANGE units long in the x and z dimension
  static createAxis = (): void => {
    let xAxisGeo = new BufferGeometry();
    let yAxisGeo = new BufferGeometry();
    let xAxisSubGeo = new BufferGeometry();//these two axes are not the main axes -- for zoom purpose only
    let yAxisSubGeo = new BufferGeometry();

    let axisMaterial: LineBasicMaterial = new LineBasicMaterial({ color:Graph.gridColor });

    let xAxisGeoPoints: Vector3[] = [];
    let xAxisSubGeoPoints: Vector3[] = [];

    let yAxisGeoPoints: Vector3[] = [];
    let yAxisSubGeoPoints: Vector3[] = [];

    yAxisGeoPoints.push(new Vector3(0, 0, Graph.gridRange));
    yAxisGeoPoints.push(new Vector3(0, 0, 0));

    yAxisSubGeoPoints.push(new Vector3(Graph.gridRange, 0, Graph.gridRange));
    yAxisSubGeoPoints.push(new Vector3(Graph.gridRange, 0, 0));
        
    xAxisGeoPoints.push(new Vector3(Graph.gridRange,0, Graph.gridRange));
    xAxisGeoPoints.push(new Vector3(0, 0, Graph.gridRange));

    xAxisSubGeoPoints.push(new Vector3(Graph.gridRange,0, 0));
    xAxisSubGeoPoints.push(new Vector3(0, 0, 0));

    xAxisGeo.setFromPoints(yAxisGeoPoints);
    xAxisSubGeo.setFromPoints(yAxisGeoPoints);

    yAxisGeo.setFromPoints(yAxisGeoPoints);
    yAxisSubGeo.setFromPoints(yAxisGeoPoints);

    let xAxis: LineSegments = new LineSegments(xAxisGeo, axisMaterial);
    let yAxis: LineSegments = new LineSegments(yAxisGeo, axisMaterial);
    let xAxisSub: LineSegments = new LineSegments(xAxisSubGeo, axisMaterial);
    let yAxisSub: LineSegments = new LineSegments(yAxisSubGeo, axisMaterial);

    xAxis.name = "xAxis";
    yAxis.name = "yAxis";
    xAxisSub.name = "xAxis";
    yAxisSub.name = "yAxis";
        
    Graph.axisGroup.add(xAxis);
    Graph.axisGroup.add(yAxis);
    Graph.axisGroup.add(xAxisSub);
    Graph.axisGroup.add(yAxisSub);
  }


  static createGrid = (): void => {
    let y: number = 0;
        
    let gridmaterial: LineBasicMaterial = new LineBasicMaterial({ color:Graph.gridColor });
        
    for (let i: number = 0; i <= Graph.gridRange; i++) {           
      let points: Vector3[] = [];
      points.push(new Vector3(i, y, 0));
      points.push(new Vector3(i, y, Graph.gridRange));
      points.push(new Vector3(0, y, i));
      points.push(new Vector3(Graph.gridRange, y, i));

      let gridgeo: BufferGeometry = new BufferGeometry().setFromPoints(points);
      Graph.gridGroup.add(new LineSegments(gridgeo, gridmaterial));
    }
  }
    
  
  static createPlane = (): void => {
    let surfaceGeo: PlaneGeometry = new PlaneGeometry(Graph.gridRange, Graph.gridRange);
    let surfaceMat: MeshBasicMaterial = new MeshBasicMaterial({ color: Graph.surfaceColor, side: DoubleSide });
    let surface: Mesh = new Mesh(surfaceGeo, surfaceMat);

    surface.rotateX(Math.PI/2);
    surface["position"].set(Graph.gridRange / 2, -0.05, Graph.gridRange / 2);

    Graph.gridGroup.add(surface);
    GraphInit.createGrid();
  }


  /*static initColorSet = (): void => {
    //pick peak color based on each peak intensity -- currently 5 levels gradient
    let intRange: number = Graph.configData[0].INTMAX - Graph.configData[0].INTMIN;
        
    for (let i = 1; i <= Graph.gradientColor.length; i++) {
      let val = Graph.configData[0].INTMIN + Math.pow(intRange, i/Graph.gradientColor.length);
      Graph.cutoff.push(val);
    } 
  }*/


  static initRenderer = (): void => {
    if (!Graph.graphEl) {
      console.error("graph element doesn't exist");
      return;
    }
    Graph.renderer.setPixelRatio( window.devicePixelRatio );
    Graph.renderer.setSize(window.innerWidth, window.innerHeight * 0.6);
    Graph.renderer.setClearColor(0xEEEEEE, 1);
    Graph.renderer.domElement.id = "canvas3D";
    Graph.graphEl.appendChild(Graph.renderer.domElement);
  }


  static initCamera = (): void => {
    Graph.camera["position"].set(15, 15, 30);
  }


  static initGraphControl = (): void => {
    /*initiate graph interactions*/
    let zoomObj: GraphZoom = new GraphZoom();
    zoomObj.main();

    let panObj: GraphPan = new GraphPan();
    panObj.main();

    let hoverObj: HoverFeature = new HoverFeature();
    hoverObj.main();

    let hoverPoint: HoverPosition = new HoverPosition();
    hoverPoint.main();

    let graphResize: GraphResize = new GraphResize();
    graphResize.main();

    //let camera: THREE.OrthographicCamera = Graph.camera;
    //let renderer: THREE.WebGLRenderer = Graph.renderer;

    /*right-click rotation controls*/
    //Graph.graphControls.mouseButtons = { ORBIT: MOUSE.RIGHT };
    //@ts-ignore type assumption is wrong for this variable
    Graph.graphControls.mouseButtons = { RIGHT: MOUSE.ROTATE};
    Graph.graphControls.addEventListener( 'change', GraphRender.checkAndRender.bind(Graph));
    Graph.graphControls.target.set(Graph.gridRange/2, 0, Graph.gridRange/2); // focus on the center of the grid
    Graph.graphControls.enablePan = false;
    Graph.graphControls.enableZoom = false;
    Graph.graphControls.enabled = true;
  }


  static initScene = (): void => {
    GraphInit.initRenderer();
    GraphInit.initCamera();
    // rendering element
    window.addEventListener("resize", GraphControl.resizeCamera);
    GraphControl.resizeCamera();
  }


  static main = (scanId: number, isFullRange: boolean) => {
    GraphInit.initScene();
    GraphInit.initGraphControl();

    GraphInit.createPlane();
    GraphInit.createAxis();
    GraphInit.createEventHandlers();
    GraphInit.createSwitchCurrentScan();
        
    UploadMzrt.main();
        
    if (isFullRange) {
      GraphData.drawFullRangeGraph(scanId);
    } else {
      GraphData.updateGraphForNewScan(scanId);
    }
        
    Graph.renderer.setAnimationLoop(function() {
      Graph.graphControls.update();
    })
  }
}
