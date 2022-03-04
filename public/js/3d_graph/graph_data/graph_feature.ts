/*graph_feature.js : draws and manages the peaks on the screen*/
import {Graph} from '../graph_init/graph.js';
import {GraphRender} from '../graph_control/graph_render.js';
import {GraphUtil} from '../graph_util/graph_util.js';
import {Object3D} from '../../../lib/js/three.module.js';

export class GraphFeature{
  constructor(){}
  /******** ADD FEAUTRE ANNOTATION ******/
  static updateFeature = (minmz: number, maxmz: number, minrt: number, maxrt: number) => {
    let featureGroup: Object3D | undefined = Graph.scene.getObjectByName("featureGroup");
    let data: FeatureDataDB[] = Graph.currentFeatureData;

    if (!featureGroup) {
      console.error("feature group does not exist");
      return;  
    }
    featureGroup.children.forEach(function(featureRect: Feature3DView, index: number) {
      if (index < data.length) {
        let feature: FeatureDataDB = data[index];
        let mz_low: number = parseFloat(feature.mz_low);
        let mz_high: number = parseFloat(feature.mz_high);
        let rt_low: number = parseFloat(feature.rt_low);
        let rt_high: number = parseFloat(feature.rt_high);
        if (rt_low == rt_high) {
          [rt_low, rt_high] = GraphUtil.addPaddingToFeature(rt_low);
        }
        if (mz_low < minmz){
          mz_low = minmz;
        }
        if (mz_high > maxmz){
          mz_high = maxmz;
        }
        if (rt_low < minrt){
          rt_low = minrt;
        }
        if (rt_high > maxrt){
          rt_high = maxrt;
        }
        if (mz_high < Graph.viewRange.mzmin || mz_low > Graph.viewRange.mzmax ||
          rt_high < Graph.viewRange.rtmin || rt_low > Graph.viewRange.rtmax) {
          featureRect.visible = false;
        } else {
          //@ts-ignore //to allow overwrite of position
          featureRect.geometry.attributes.position.array[0] = 0;//vertex at bottom left (0,0)
          //@ts-ignore //to allow overwrite of position
          featureRect.geometry.attributes.position.array[3] = mz_high - mz_low;
          //@ts-ignore //to allow overwrite of position
          featureRect.geometry.attributes.position.array[5] = 0;//vertex at bottom right
          //@ts-ignore //to allow overwrite of position
          featureRect.geometry.attributes.position.array[6] = mz_high - mz_low;
          //@ts-ignore //to allow overwrite of position
          featureRect.geometry.attributes.position.array[8] = rt_high - rt_low;//vertex at top right
          //@ts-ignore //to allow overwrite of position
          featureRect.geometry.attributes.position.array[9] = 0;
          //@ts-ignore //to allow overwrite of position
          featureRect.geometry.attributes.position.array[11] = rt_high - rt_low;//vertex at top left
          //@ts-ignore //to allow overwrite of position
          featureRect.geometry.attributes.position.array[12] = 0;
          //@ts-ignore //to allow overwrite of position
          featureRect.geometry.attributes.position.array[14] = 0;//vertex ad bottom left (0,0)
          featureRect.position.set(mz_low, 0, rt_low);

          featureRect.geometry.attributes.position.needsUpdate = true; 
          featureRect.computeLineDistances();
          featureRect.mz_low = mz_low;
          featureRect.mz_high = mz_high;
          featureRect.rt_low = rt_low;
          featureRect.rt_high = rt_high;
          featureRect.featureId = parseInt(feature.id);

          featureRect.mass = parseFloat(feature.mass);
          featureRect.mono_mz = parseFloat(feature.mono_mz);
          featureRect.charge = parseFloat(feature.charge);
          featureRect.intensity = parseFloat(feature.intensity);
          featureRect.visible = true;
          }
      } else{
        featureRect.visible = false;
      }
    })
  }


  static loadMzrtData = (minmz: number, maxmz: number, minrt: number, maxrt: number): Promise<void> => {
    return new Promise((resolve, reject) => {
      //load feature data in this range
      let xhttp = new XMLHttpRequest();
      xhttp.open("GET","loadMzrtData?projectDir=" + Graph.projectDir + "&minRT=" + minrt + "&maxRT=" + maxrt + "&minMZ=" + minmz + "&maxMZ=" + maxmz + "&limit=" + 500, true);
            
      xhttp.onload = () => {
        if (xhttp.readyState == 4 && xhttp.status == 200) {
          let featureData: FeatureDataDB[] = JSON.parse(xhttp.responseText);
          Graph.currentFeatureData = featureData;
          resolve();
        } 
      }
      xhttp.send();
    })
  } 


  static drawFeature = (viewRange: Range3DView): Promise<void> => {
    return new Promise((resolve, reject) => {
      if($('#featureStatus').val() != "0"){
        let promise: Promise<any> = GraphFeature.loadMzrtData(viewRange.mzmin, viewRange.mzmax, viewRange.rtmin, viewRange.rtmax);
        promise.then(() => {
          GraphFeature.updateFeature(viewRange.mzmin, viewRange.mzmax, viewRange.rtmin, viewRange.rtmax);       
          return;
        }).then(() => {
          resolve();
        })
      } else {
        let featureInfo: HTMLDivElement | null = document.querySelector<HTMLDivElement>("#featureInfo");
        if (featureInfo) {
          featureInfo.style.display = "none";  
        } else {
          console.error("feature table div doesn't exist");
        }
        resolve();
      }
    })
  }


  static drawFeatureNoDataLoad = (viewRange: Range3DView): Promise<void> => {
    return new Promise((resolve, reject) => {
      GraphFeature.updateFeature(viewRange.mzmin, viewRange.mzmax, viewRange.rtmin, viewRange.rtmax);
      resolve();
    })
  }


  static hideFeature = (): void => {
    let featureGroup: Object3D | undefined = Graph.scene.getObjectByName("featureGroup");
    if (!featureGroup) {
      console.error("feature group doesn't exist");
      return;
    }
    featureGroup.visible = false;
    GraphRender.renderImmediate();
  }


  static showFeature = (): void => {
    let featureGroup: Object3D | undefined = Graph.scene.getObjectByName("featureGroup");
    if (!featureGroup) {
        console.error("feature group doesn't exist");
        return;
    }
    featureGroup.visible = true;
    GraphRender.renderImmediate();
  }
}