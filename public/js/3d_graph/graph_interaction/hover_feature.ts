/*hover_feature.js: on hover, highlught and display feature information (scan ID, intensity, rt, mz)*/
import {Graph} from '../graph_init/graph.js';
import {GraphUtil} from '../graph_util/graph_util.js';
import {Group} from '../../../lib/js/three.module.js';

export class HoverFeature{
  constructor(){};
  static findFeatureOnHover = (event, objGroup): Feature3DView | null => {
    let [mz, rt]: number[] = GraphUtil.getMzRtCoordinate(event);
    let mzThreshold: number = Graph.viewRange.mzrange / 60;
    let rtThreshold: number = Graph.viewRange.rtrange / 60;
        
    for (let i: number = 0; i < objGroup.children.length; i++) {
      let feature: Feature3DView = objGroup.children[i];
      if (feature.visible) {
        //if close to one of the edges of the feature annotation rect
        if ((Math.abs(mz - feature.mz_low) <= mzThreshold && rt >= feature.rt_low && rt <= feature.rt_high) || 
          (Math.abs(mz - feature.mz_high) <= mzThreshold && rt >= feature.rt_low && rt <= feature.rt_high) || 
          (Math.abs(rt - feature.rt_low) <= rtThreshold && mz >= feature.mz_low && mz <= feature.mz_high) ||
          (Math.abs(rt - feature.rt_high) <= rtThreshold && mz >= feature.mz_low && mz <= feature.mz_high)) 
        {
          return feature;
        }
      }
    }
    return null;
  }


  onMouseOver = (event: MouseEvent) => {
    let tooltip: HTMLDivElement | null = document.querySelector<HTMLDivElement>("#tooltip");
    let tooltipText: HTMLSpanElement | null = document.querySelector<HTMLSpanElement>("#tooltiptext");

    if (event.ctrlKey) {
      let objGroup: Group | undefined = Graph.scene.getObjectByName("featureGroup");
      let obj: Feature3DView | null = HoverFeature.findFeatureOnHover(event, objGroup);

      if (obj != null){
        let intensity: string = '';
        if (obj.intensity > 0) {
          intensity = GraphUtil.formatScientificNotation(obj.intensity);
        }

        if (tooltip) {
          tooltip.style.display = "inline-block";
          tooltip.style.top = (event.clientY - 10) + 'px';
          tooltip.style.left = (event.clientX + 20) + 'px';
        } else {
          console.error("there is no tooltip element");
        }

        if (tooltipText) {
          tooltipText.innerHTML = "feature ID: " + obj.featureId + "<br/>" + "mass: " + obj.mass + "<br/>" + "mono_mz: " + obj.mono_mz + 
          "<br/>" + "charge: " + obj.charge + "<br/>" + "intensity: " + intensity;
        } else {
          console.error("there is no tooltipText element");
        }
      } else {
        if (tooltip) {
          tooltip.style.display = "none";
        }
      }
    } else{
      if (tooltip) {
        tooltip.style.display = "none";
      }
    }
  }


  main = () => {
    Graph.renderer.domElement.addEventListener('mousemove', this.onMouseOver, false);
  }
}
