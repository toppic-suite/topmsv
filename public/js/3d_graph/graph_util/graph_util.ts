/*graph_util.js: class for utility functions used throughout the 3d graph*/
import * as THREE from '../../../lib/js/three.module.js';
import {Graph} from '../graph_init/graph.js';

export class GraphUtil{
  constructor(){}
  
  static disposeObject = (obj): void => {
    if (obj.material.map) {
      obj.material.map.dispose();
    }
    if (obj.material) {
      obj.material.dispose();
    }
    if (obj.geometry) {
      obj.geometry.dispose();
    }
    if (obj.dispose) {
      obj.dispose();
    }
  }


  static emptyGroup = (g: THREE.Object3D<THREE.Event>) => {
    while (g.children.length > 0) {
      let obj = g.children.pop();
      GraphUtil.disposeObject(obj);
    }
  }


  static formatScientificNotation = (intensity: number) => {
    let sciNumber: string = intensity.toExponential(Graph.resultViz.getConfig().scientificDigit);
    return sciNumber;
  }


  static formatFloat = (num: string | number): string => {
    if (typeof num == "number") {
      return num.toFixed(Graph.resultViz.getConfig().floatDigit);
    } else if (typeof num == "string") {
      if (isNaN(parseFloat(num))) {
        return '';
      } else {
        return parseFloat(num).toFixed(Graph.resultViz.getConfig().floatDigit);
      }
    }
    return '';
  }


  static updateTextBox = (): void => {
    //update data range in textboxes if getting range from each scan, not by users
    let centerRT: number = (Graph.viewRange.rtmax + Graph.viewRange.rtmin)/2;
    let rangeRT: number = Graph.viewRange.rtmax - centerRT;
    let centerMZ: number = (Graph.viewRange.mzmax + Graph.viewRange.mzmin)/2;
    let rangeMZ: number = Graph.viewRange.mzmax - centerMZ;

    let rtRangeMin = document.querySelector<HTMLInputElement>('#rtRangeMin');
    let rtRangeMax = document.querySelector<HTMLInputElement>('#rtRangeMax');
    let mzRangeMin = document.querySelector<HTMLInputElement>('#mzRangeMin');
    let mzRangeMax = document.querySelector<HTMLInputElement>('#mzRangeMax');

    if (!rtRangeMax || !rtRangeMin) {
      console.error("rt range box cannot be found");
      return;
    }
    if (!mzRangeMax || !mzRangeMin) {
      console.error("mz range box cannot be found");
      return;
    }
    rtRangeMin.value = centerRT.toFixed(3);
    rtRangeMax.value = rangeRT.toFixed(2);
    mzRangeMin.value = centerMZ.toFixed(3);
    mzRangeMax.value = rangeMZ.toFixed(2);
  }


  static roundTo = (number: number, places: number): number => {
    let power: number = Math.pow(10, places);
    return Math.round(number * power) / power;
  }


  static sortByRT = (a: PeakDataDB, b: PeakDataDB): number => {
    const rtA: number = parseFloat(a.RETENTIONTIME);
    const rtB: number = parseFloat(b.RETENTIONTIME);
    
    let comparison: number = 0;
    
    if (rtA > rtB) {
        comparison = 1;
    } else if (rtA < rtB) {
        comparison = -1;
    }
    return comparison;
  }


  /*related to mouse interaction*/
  static findObjectHover = (event: WheelEvent, objGroup: THREE.Object3D<THREE.Event>): THREE.Object3D<THREE.Event> | null => {
    let el: HTMLCanvasElement = Graph.renderer.domElement;
    let canvasPosition: DOMRect = Graph.renderer.domElement.getBoundingClientRect();

    //find mouse position, normalized to a [-1,1] in both x/y-axes on screen
    let coord: {"x": number, "y": number} = {
      x: ((event.clientX  - canvasPosition.left) / el.offsetWidth)  * 2 - 1,
      y: - ((event.clientY  - canvasPosition.top) / el.offsetHeight) * 2 + 1
    };
    let raycaster: THREE.Raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(coord, Graph.camera);

    let intersects: THREE.Intersection<THREE.Object3D<THREE.Event>>[] = raycaster.intersectObjects( objGroup.children );
    if (intersects.length > 0){
      return intersects[0].object;
    } else{
      return null;
    }
  }


  static getMousePosition = (event: MouseEvent | WheelEvent): THREE.Vector3 => {
    let el: HTMLCanvasElement = Graph.renderer.domElement;
    let canvasPosition: DOMRect = Graph.renderer.domElement.getBoundingClientRect();

    //find mouse position, normalized to a [-1,1] in both x/y-axes on screen
    let coord: {x: number, y: number} = {
        x: ((event.clientX  - canvasPosition.left) / el.offsetWidth)  * 2 - 1,
        y: - ((event.clientY  - canvasPosition.top) / el.offsetHeight) * 2 + 1
    };
    let raycaster: THREE.Raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(coord, Graph.camera);

    let pos: THREE.Vector3 = new THREE.Vector3( 0, 1, 0 );
    raycaster.ray.intersectPlane(Graph.graphPlane, pos);
    if (pos) {
      //convert world coordinates to graph-fractional coordinates
      pos.multiply(Graph.rangeTransform);
      pos.z = 1 - pos.z;
    }
    return pos;
  }


  static getMzRtCoordinate = (event: MouseEvent): number[] => {
    let mousePos: THREE.Vector3 = GraphUtil.getMousePosition(event);
    let mz: number = mousePos.x * Graph.viewRange.mzrange + Graph.viewRange.mzmin;//current mz and rt that has a cursor pointed to
    let rt: number = mousePos.z * Graph.viewRange.rtrange + Graph.viewRange.rtmin;

    if (mz < Graph.viewRange.mzmin){
      mz = -1;
    } else if(mz > Graph.viewRange.mzmax){
      mz = -1;
    } else{
      mz = parseFloat(mz.toFixed(3));
    }

    if(rt < Graph.viewRange.rtmin){
      rt = -1;
    } else if(rt > Graph.viewRange.rtmax){
      rt = -1;
    } else{
      rt = parseFloat(rt.toFixed(3));
    }
    return [mz, rt];
  }


  static findNearestRt = (rt: number): number => {
    let rtScanData: InteRtObj[] = Graph.resultViz.getRtInteGraph().inteRtArray;
    let threshold: number = Graph.viewRange.rtrange / 100;
    for (let i = 0; i < rtScanData.length; i++) {
      let diff: number = Math.abs(parseFloat(rtScanData[i].rt.toFixed(5)) - parseFloat((rt).toFixed(5)));
      if (diff < threshold) {
        return rtScanData[i].rt;   
      }
    }     
    return -1;   
  }


  static findNearestScan = (rt: number): number => {
    let rtScanData: InteRtObj[] = Graph.resultViz.getRtInteGraph().inteRtArray;
    let threshold: number = Graph.viewRange.rtrange / 100;
    for (let i: number = 0; i < rtScanData.length; i++) {
      let diff: number = Math.abs(parseFloat(rtScanData[i].rt.toFixed(5)) - parseFloat((rt).toFixed(5)));
      if (diff < threshold) {
        return rtScanData[i].scanNum;   
      }
    }     
    return -1;   
  }


  static findIonTime = (rt: number): number => {
    let rtScanData: InteRtObj[] = Graph.resultViz.getRtInteGraph().inteRtArray;
    let threshold: number = Graph.viewRange.rtrange / 100;
    if ('ionTime' in rtScanData[0]) {
      for (let i: number = 0; i < rtScanData.length; i++) {
        let diff = Math.abs(parseFloat(rtScanData[i].rt.toFixed(5)) - parseFloat((rt).toFixed(5)));
        if (diff < threshold) {
          return rtScanData[i].ionTime;   
        }
      }     
      return -1;   
    }
    else{
      return -1;
    }
  }

  
  static getTotalScanCount = async (): Promise<string> => {
    let fullDir: string = Graph.projectDir;

    let res: Response = await fetch('/getTotalScanCount?' + new URLSearchParams({
        projectDir: fullDir
    }));
    let resJSON: {"COUNT": string} = await res.json();

    return resJSON.COUNT;
  }


  static addPaddingToFeature = (rt: number): [number, number] => {
    let rt_row: number = rt * (1 - Graph.featurePadding);
    let rt_high: number = rt * (1 + Graph.featurePadding);

    return [rt_row, rt_high];
  }
}