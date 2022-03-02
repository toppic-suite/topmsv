/*load_data.js: calculate which table to use, query database for data, and return result*/
import {Graph} from '../graph_init/graph.js';

export class LoadData{
  constructor(){}
  static getExpectedPeakNum = (): Promise<string> => {
    /*get expected peak number from init.ini file*/
    return new Promise((resolve, reject) => {
      let xhttp = new XMLHttpRequest();
 
      xhttp.open("GET","getExpectedPeakNum?", true);

      xhttp.onload = () => {
        if (xhttp.status == 200 && xhttp.readyState == 4) {
          let peakNum: string = xhttp.response;
          resolve(peakNum);
        }     
      }
      xhttp.send();
    });
  }
  static calculateTableNum = async (): Promise<number> => {
    /*decide which table to query based on what is the ratio is between current range and whole graph
    if the ratio is small (1:100), the detail level is high, and the peaks in that range are more*/
    let tableNum: number = -1;
      
    let totalMzRange: number = Graph.configData[0].MZMAX- Graph.configData[0].MZMIN; 
    let totalRtRange: number = Graph.configData[0].RTMAX - Graph.configData[0].RTMIN;
    
    let xRatio: number = (Graph.viewRange.mzmax - Graph.viewRange.mzmin) / totalMzRange;
    let yRatio: number = (Graph.viewRange.rtmax - Graph.viewRange.rtmin) / totalRtRange;

    if (yRatio == 0 ) {
      //yRatio can be zero when refocuing to a feature with same min max rt
      yRatio = 1;
    }
    //get expected peak count from the text file
    let expectedPeakNum: number = -1;

    await LoadData.getExpectedPeakNum().then((peakNum) => {
      expectedPeakNum = parseInt(peakNum);
    })

    let peakCnt: number = expectedPeakNum / (xRatio * yRatio);
    let diff: number = Number.MAX_VALUE;
    //find which table has the closet number of peaks
    for (let i: number = 0; i < Graph.configData.length; i++){
      if (Math.abs(Graph.configData[i].COUNT - peakCnt) < diff){
        diff = Math.abs(Graph.configData[i].COUNT - peakCnt);
        tableNum = i;
      }
    }
    if (tableNum < 0){
      console.log("something wrong during calculateTableNum")
      return -1;
    }
    return tableNum;
  }
  static getRT = (scanNum: number): Promise<number> => {
    return new Promise(function(resolve, reject){
      let fullDir: string = Graph.projectDir;
      let dotIndex: number = fullDir.lastIndexOf(".");
      let dir: string = (fullDir.substr(0, dotIndex)).concat(".db");

      let xhttpRT: XMLHttpRequest = new XMLHttpRequest();
      xhttpRT.onreadystatechange = function () {
      if (this.readyState == 4 && this.status == 200) {
        let rt: number = parseFloat(this.responseText);
                    
        if (rt != undefined && rt != 0){
          resolve(rt);
        } 
      }
    };
    xhttpRT.open("GET", "getRT?projectDir=" + dir + "&scanID=" + scanNum, true);
    xhttpRT.send();
    })
  }
  static getConfigData = (): Promise<ConfigData> => {
    return new Promise(function(resolve, reject){
      let fullDir: string = Graph.projectDir;
      let dotIndex: number = fullDir.lastIndexOf(".");
      let dir: string = (fullDir.substr(0, dotIndex)).concat(".db");
    
      let xhttp3: XMLHttpRequest = new XMLHttpRequest();
      xhttp3.onreadystatechange = function (){
        if (this.readyState == 4 && this.status == 200) {
          let result: ConfigData = JSON.parse(this.responseText);
    
          if (result != undefined){
            resolve(result);
          } else{
            reject("max values are undefined")
          }
        }
      }
      xhttp3.open("GET","getMax?projectDir=" + dir + "&colName=" + 'MZ',true);
      xhttp3.send();
    });
  }
  static load3dData = (curViewRange: Range3DView): Promise<PeakDataDB[]> => {
    /*load data from database based on current graph range*/
    return new Promise(async(resolve, reject) => {
      let xhttp: XMLHttpRequest = new XMLHttpRequest();
      let tableNum: number = await LoadData.calculateTableNum();
      let fullDir: string = Graph.projectDir;
      let dotIndex: number = fullDir.lastIndexOf(".");
      let dir: string = (fullDir.substr(0, dotIndex)).concat(".db");
      let inteCutOffBox: HTMLInputElement | null = document.querySelector<HTMLInputElement>("#cutoff-threshold");
      if (!inteCutOffBox) {
        console.error("there is no intensity cutoff text box");
        return;
      }
      let inteCutoff: string = inteCutOffBox.value;

      if (inteCutoff == '') {
        inteCutoff = '0';
      }
        xhttp.open("GET","load3dDataByParaRange?projectDir=" + dir + "&tableNum=" + tableNum + "&minRT=" + curViewRange.rtmin + "&maxRT=" + curViewRange.rtmax + "&minMZ=" + curViewRange.mzmin + "&maxMZ=" + curViewRange.mzmax + "&maxPeaks=" + Graph.maxPeaks + "&cutoff=" + inteCutoff, true);
        xhttp.onload = () => {
          if (xhttp.status == 200 && xhttp.readyState == 4) {
            let peakData: PeakDataDB[] = JSON.parse(xhttp.response);
            resolve(peakData);
          }     
        }
        xhttp.send();
      });
    }
  }