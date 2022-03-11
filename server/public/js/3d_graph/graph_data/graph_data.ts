/*graph_data.js : draws and manages the peaks on the screen*/
import {Graph} from '../graph_init/graph.js';
import {GraphControl} from '../graph_control/graph_control.js';
import {GraphRender} from '../graph_control/graph_render.js';
import {GraphFeature} from '../graph_data/graph_feature.js';
import {GraphLabel} from '../graph_util/graph_label.js';
import {GraphUtil} from '../graph_util/graph_util.js';
import {LoadData} from '../graph_data/load_data.js';
import { Object3D, Group, Line } from '../../../lib/js/three.module.js';

export class GraphData{
  constructor(){}
  /******** ADD HORIZONTAL MARKER FOR WHERE CURRENT SCANS ARE ******/
  static drawCurrentScanMarker = (): void => {
    let markerGroup: Object3D | undefined = Graph.scene.getObjectByName("markerGroup");
    if (markerGroup) {
      markerGroup.children.forEach(function(line) {
        line.position.set(0, 0.01, Graph.curRT);
        line.visible = true;
      })
    }
  }
  /******** CALCULATE AND SET DATA RANGE ******/
  static getInteRange = (points): void => {
    let intmin: number = Infinity;
    let intmax: number = 0;
    Graph.intensitySum = 0;
    for (let i: number = 0; i < points.length; i++){
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
  /*static setInitViewRange = (mzminRaw, mzmaxRaw, curRTRaw): void => {
    let curRT: number = parseFloat(curRTRaw);
    let rtmax: number = curRT + Graph.rtRange;
    let rtmin: number = curRT - Graph.rtRange;
    let mzmax: number = parseFloat(mzmaxRaw);
    let mzmin: number = parseFloat(mzminRaw);
    
    let dataTotal = Graph.configData[0];

    if (rtmax > dataTotal.RTMAX){
        rtmax = dataTotal.RTMAX;
    }
    if (rtmin < 0){
        rtmin = 0;
    }
    /*if (mzmax > dataTotal.MZMAX){
        mzmax = dataTotal.MZMAX;
    }*//*
    if (mzmin < 0){
        mzmin = 0;
    }
    Graph.curRT = curRT;

    Graph.viewRange.mzmin = mzmin;
    Graph.viewRange.mzmax = mzmax;
    Graph.viewRange.mzrange = mzmax - mzmin;
    
    Graph.viewRange.rtmin = rtmin;
    Graph.viewRange.rtmax = rtmax;
    Graph.viewRange.rtrange = rtmax - rtmin;
  }*/
  static setViewRange = (mzmin: number, mzmax: number, rtmax: number, rtmin: number, curRT: number): void => {
    let dataTotal: ConfigData = Graph.configData[0];

    if (rtmax > dataTotal.RTMAX){
        rtmax = dataTotal.RTMAX;
    }
    if (rtmin < 0){
        rtmin = 0;
    }
    /*if (mzmax > dataTotal.MZMAX){
        mzmax = dataTotal.MZMAX;
    }*/
    if (mzmin < 0){
        mzmin = 0;
    }
    Graph.curRT = curRT;

    Graph.viewRange.mzmin = mzmin;
    Graph.viewRange.mzmax = mzmax;
    Graph.viewRange.mzrange = mzmax - mzmin;
    
    Graph.viewRange.rtmin = rtmin;
    Graph.viewRange.rtmax = rtmax;
    Graph.viewRange.rtrange = rtmax - rtmin;
  }
  static setViewRangeForNewScan = (curRT: number): void => {
    let dataTotal: ConfigData = Graph.configData[0];
    let rtInterval: number = (dataTotal.RTMAX - dataTotal.RTMIN) / Graph.ms1ScanCount;
    Graph.curRT = curRT;

    Graph.viewRange.mzmin = 0;
    Graph.viewRange.mzmax = dataTotal.MZMAX;
    Graph.viewRange.mzrange = dataTotal.MZMAX;
    
    Graph.viewRange.rtmin = curRT - (rtInterval * Graph.scanDisplayed / 2);
    Graph.viewRange.rtmax = curRT + (rtInterval * Graph.scanDisplayed / 2);
    Graph.viewRange.rtrange = Graph.viewRange.rtmax - Graph.viewRange.rtmin;
  }
  static setViewRangeToFull = (): void => {
    Graph.viewRange.mzmin = 0;
    Graph.viewRange.mzmax = Graph.dataRange.mzmax;
    Graph.viewRange.mzrange = Graph.dataRange.mzmax;
    
    Graph.viewRange.rtmin = 0;
    Graph.viewRange.rtmax = Graph.dataRange.rtmax;
    Graph.viewRange.rtrange = Graph.dataRange.rtmax;
  }
  /******** PLOT PEAKS ******/
  static updateGraph = async(mzmin: number, mzmax: number, rtmin: number, rtmax: number, curRT: number): Promise<any> => {
    GraphData.setViewRange(mzmin, mzmax, rtmax, rtmin, curRT);
    await GraphData.draw(curRT);
    /*if (Graph.isUpdateTextBox){
        GraphUtil.updateTextBox();
    }*/
  }
  static updateGraphNoNewData = (mzmin: number, mzmax: number, rtmin: number, rtmax: number, curRT: number): void => {
    GraphData.setViewRange(mzmin, mzmax, rtmax, rtmin, curRT);
    GraphData.drawNoNewData(curRT);
    /*if (Graph.isUpdateTextBox){
        GraphUtil.updateTextBox();
    }*/
  }
  static drawFullRangeGraph = (scanID: number): void => {
    let promise: Promise<number> = LoadData.getRT(scanID);
    promise.then((rt: number) =>{
        Graph.curRT = rt;
        GraphData.setViewRangeToFull();
        GraphData.draw(Graph.curRT);
        /*if (Graph.isUpdateTextBox){
            GraphUtil.updateTextBox();
        }*/
    })
  }
    /*static drawInitGraph = (mzmin, mzmax, scanID) => {
        let promise = LoadData.getRT(scanID);
        promise.then(async(curRT) =>{
            GraphData.setInitViewRange(mzmin, mzmax, curRT);
            await GraphData.draw(curRT);
            /*if (Graph.isUpdateTextBox){
                GraphUtil.updateTextBox();
            }*//*
        })
    }*/
  static updateGraphForNewScan = (scanID: number): void => {
    let promise: Promise<number> = LoadData.getRT(scanID);
    promise.then(async(curRT: number) =>{
      GraphData.setViewRangeForNewScan(curRT);
      await GraphData.draw(curRT);
    })
  }
  /******** PLOT PEAKS ******/
  static draw = async(curRT: number = Graph.curRT): Promise<any> => {   
    const curViewRange: Range3DView = Graph.viewRange;
    Graph.curRT = curRT;
    Graph.currentData = await LoadData.load3dData(curViewRange);
    GraphData.getInteRange(Graph.currentData);
    //if camera angle is perpendicular to the graph plane
    if (Graph.isPerpendicular){
      await GraphData.plotPoint2D();
    }
    else{
      await GraphData.updatePeaks(Graph.currentData);
    }
    Graph.viewRange["intscale"] = 1;

    // make sure the groups are plotted and update the view
    if (Graph.curRT <= Graph.viewRange.rtmax && Graph.curRT >= Graph.viewRange.rtmin){
      if ($("#highlight-cur-scan").prop("checked")) {
        await GraphData.drawCurrentScanMarker();
      }
    }
    else{
      let markerGroup: Object3D | undefined = Graph.scene.getObjectByName("markerGroup");
      if (markerGroup) {
        markerGroup.children.forEach(function(line: Object3D): void {
          line.visible = false;
        })
      } else {
        console.error("there is no markergroup");
      }
    }
    GraphLabel.displayGraphData(Graph.currentData.length);//display metadata about the graph

    await GraphFeature.drawFeature(Graph.viewRange);

    GraphControl.updateViewRange(Graph.viewRange);
    GraphRender.renderImmediate();
  }
  static drawNoNewData = async(checkIntensity): Promise<any> => {
    //if camera angle is perpendicular to the graph plane
    if (Graph.isPerpendicular){
      GraphData.plotPoint2D();
    }
    else{
      await GraphData.updatePeaks(Graph.currentData);
    }
    Graph.viewRange["intscale"] = 1;

    // make sure the groups are plotted and update the view
    if (Graph.curRT <= Graph.viewRange.rtmax && Graph.curRT >= Graph.viewRange.rtmin){
      if ($("#highlight-cur-scan").prop("checked")) {
        GraphData.drawCurrentScanMarker();
      }
    } else{
      let markerGroup: Object3D | undefined = Graph.scene.getObjectByName("markerGroup");

      if (markerGroup) {
        markerGroup.children.forEach(function(line: Line): void {
          line.visible = false;
        })
      } else {
        console.error("there is no markergroup");
      }   
    }
    GraphLabel.displayGraphData(Graph.currentData.length);//display metadata about the graph

    await GraphFeature.drawFeatureNoDataLoad(Graph.viewRange);

    GraphControl.updateViewRange(Graph.viewRange);
    GraphRender.renderImmediate();
  }
  static plotPoint2D = (): void => {
    let prevSpecRT: number = 0; 
    let prevPeakRT: number = 0;

    let curRt: number = parseFloat(Graph.curRT.toFixed(4));
    //let rt = document.getElementById("scan1RT").innerText;
    
    let dataGroup: Object3D | undefined = Graph.scene.getObjectByName("dataGroup");
    let peak2DGroup: Group = Graph.peak2DGroup;

    if (!dataGroup) {
      console.error("datagroup doesn't exist");
      return;
    }
        
    //sort data by rt
    Graph.currentData.sort(GraphUtil.sortByRT);
                    
    if (Graph.currentData.length > 0){
      prevPeakRT = parseFloat(Graph.currentData[Graph.currentData.length - 1].RETENTIONTIME);
    }
    peak2DGroup.children.forEach(function(line: Peak3DView, index: number) {
      if (index < Graph.currentData.length) {
        let point: PeakDataDB = Graph.currentData[Graph.currentData.length - 1 - index];
        let mz: number = parseFloat(point.MZ);
        let inte: number = parseFloat(point.INTENSITY);
        let rt: number = parseFloat(point.RETENTIONTIME);

        if (mz >= Graph.viewRange.mzmin && mz <= Graph.viewRange.mzmax &&
          rt >= Graph.viewRange.rtmin && rt <= Graph.viewRange.rtmax) {
          let lineColor = Graph.peakColor[point.COLOR];

          //ySize is current retention time - prevRT
          //for the first spectra peaks, it is a set length;
          //while current peak has same RT as the previous peak, keep iterating
          //if current peak has different RT as the previous peak, update prevRT as the previous peak RT
                
          if (rt != prevPeakRT){
            prevSpecRT = prevPeakRT;
          }

          let ySize: number = prevSpecRT - rt; //peak length
          let rtRange: number = Graph.viewRange.rtmax - Graph.viewRange.rtmin;
          let minSize: number = rtRange/60;

          //for special cases when should not be using the calculated ysize value
          if (ySize < minSize){//minimum length for the peak
            ySize = minSize;
          }
          if (prevSpecRT == 0){//when it is the spectra peaks with the highets rt (no previous spectra)
            ySize = rtRange / (2 * 60);
          }
          //@ts-ignore //allow overwrite
          line.geometry.attributes.position.array[5] = ySize;
          line.geometry.attributes.position.needsUpdate = true; 
          line.material["color"].setStyle(lineColor);
        
        if (parseFloat(rt.toFixed(4)) == curRt && Graph.isHighlightingCurrentScan){
            line.material["color"].setStyle(Graph.currentScanColor);
        }

        line.position.set(mz, 0, rt);
        line.pointid = point.ID;
        line.mz = mz;
        line.rt = rt;
        line.int = inte;
        line.name = "peak";
        line.visible = true;

        prevPeakRT = rt;
        }
        else{
            line.visible = false;
        }
        }
        else{
            line.visible = false;
        }
        // Reposition the plot so that mzmin,rtmin is at the correct corner
        dataGroup!.add(peak2DGroup);
    })
  }
  static updatePeaks = (data: PeakDataDB[]) => {
    let plotGroup: Object3D | undefined = Graph.scene.getObjectByName("plotGroup");
    if (!plotGroup) {
      console.error("plotgroup doesn't exist");
      return;
    }

    //if auto scaling is on, plotgroup scale needs to be reset beforehand (because it may have been changed due to manual scaling using ctrl + scroll)
    let inteAutoAdjust: HTMLInputElement | null = document.querySelector<HTMLInputElement>("#inte-auto-adjust");
    if (inteAutoAdjust) {
      if (inteAutoAdjust.checked) {
        let scale: number = Graph.maxPeakHeight / Graph.dataRange.intmax;
        plotGroup["scale"].set(plotGroup["scale"]["x"], scale, plotGroup["scale"]["z"]);
      }
    }
    let intScale = GraphControl.calcIntScale();
    //iterate through peask in plot group while < data.length;
    //for the rest of peaks, turn off visibility
    plotGroup.children.forEach(function(line: Peak3DView, index: number) {
      if (index < data.length) {
        let point: PeakDataDB = data[index];
        let id: string = point.ID;
        let mz: number = parseFloat(point.MZ);
        let rt: number = parseFloat(point.RETENTIONTIME);
        let inten: number = parseFloat(point.INTENSITY);
        let lineColor = Graph.peakColor[point.COLOR];

        if (mz >= Graph.viewRange.mzmin && mz <= Graph.viewRange.mzmax &&
          rt >= Graph.viewRange.rtmin && rt <= Graph.viewRange.rtmax) {

          let currt: string = Graph.curRT.toFixed(4);
          let lowPeak: boolean = false;
          let y: number = inten;    
          //if y is much smaller than the highest intensity peak in the view range
          if (y * plotGroup!["scale"]["y"] * intScale < GraphControl.scaleWorldUnitToInte(Graph.minPeakHeight)) {
              //increase y so that later y is at least minHeight when scaled
              y = GraphControl.scaleWorldUnitToInte(Graph.minPeakHeight)/(plotGroup!["scale"]["y"] * intScale);
              lowPeak = true;
          } 

          //@ts-ignore to allow overwrite
          line.geometry.attributes.position.array[4] = inten;
          line.geometry.attributes.position.needsUpdate = true; 

          line.material["color"].setStyle(lineColor);
          if (rt.toFixed(4) == currt && Graph.isHighlightingCurrentScan){
              line.material["color"].setStyle(Graph.currentScanColor);
          }
          line.position.set(mz, 0, rt);
          line.pointid = id;
          line.mz = mz;
          line.rt = rt;
          line.int = inten;
          line.height = y;
          line.name = "peak";
          line.visible = true;

        } else{
          line.visible = false;
        }
      } else{
        line.visible = false;
      }
    })
  }
}