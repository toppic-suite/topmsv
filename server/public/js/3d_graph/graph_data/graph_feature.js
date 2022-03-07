/*graph_feature.js : draws and manages the peaks on the screen*/
import { Graph } from '../graph_init/graph.js';
import { GraphRender } from '../graph_control/graph_render.js';
import { GraphUtil } from '../graph_util/graph_util.js';
export class GraphFeature {
    constructor() { }
}
/******** ADD FEAUTRE ANNOTATION ******/
GraphFeature.updateFeature = (minmz, maxmz, minrt, maxrt) => {
    let featureGroup = Graph.scene.getObjectByName("featureGroup");
    let data = Graph.currentFeatureData;
    if (!featureGroup) {
        console.error("feature group does not exist");
        return;
    }
    featureGroup.children.forEach(function (featureRect, index) {
        if (index < data.length) {
            let feature = data[index];
            let mz_low = parseFloat(feature.mz_low);
            let mz_high = parseFloat(feature.mz_high);
            let rt_low = parseFloat(feature.rt_low);
            let rt_high = parseFloat(feature.rt_high);
            if (rt_low == rt_high) {
                [rt_low, rt_high] = GraphUtil.addPaddingToFeature(rt_low);
            }
            if (mz_low < minmz) {
                mz_low = minmz;
            }
            if (mz_high > maxmz) {
                mz_high = maxmz;
            }
            if (rt_low < minrt) {
                rt_low = minrt;
            }
            if (rt_high > maxrt) {
                rt_high = maxrt;
            }
            if (mz_high < Graph.viewRange.mzmin || mz_low > Graph.viewRange.mzmax ||
                rt_high < Graph.viewRange.rtmin || rt_low > Graph.viewRange.rtmax) {
                featureRect.visible = false;
            }
            else {
                //@ts-ignore //to allow overwrite of position
                featureRect.geometry.attributes.position.array[0] = 0; //vertex at bottom left (0,0)
                //@ts-ignore //to allow overwrite of position
                featureRect.geometry.attributes.position.array[3] = mz_high - mz_low;
                //@ts-ignore //to allow overwrite of position
                featureRect.geometry.attributes.position.array[5] = 0; //vertex at bottom right
                //@ts-ignore //to allow overwrite of position
                featureRect.geometry.attributes.position.array[6] = mz_high - mz_low;
                //@ts-ignore //to allow overwrite of position
                featureRect.geometry.attributes.position.array[8] = rt_high - rt_low; //vertex at top right
                //@ts-ignore //to allow overwrite of position
                featureRect.geometry.attributes.position.array[9] = 0;
                //@ts-ignore //to allow overwrite of position
                featureRect.geometry.attributes.position.array[11] = rt_high - rt_low; //vertex at top left
                //@ts-ignore //to allow overwrite of position
                featureRect.geometry.attributes.position.array[12] = 0;
                //@ts-ignore //to allow overwrite of position
                featureRect.geometry.attributes.position.array[14] = 0; //vertex ad bottom left (0,0)
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
        }
        else {
            featureRect.visible = false;
        }
    });
};
GraphFeature.loadMzrtData = (minmz, maxmz, minrt, maxrt) => {
    return new Promise((resolve, reject) => {
        //load feature data in this range
        let xhttp = new XMLHttpRequest();
        xhttp.open("GET", "loadMzrtData?projectDir=" + Graph.projectDir + "&minRT=" + minrt + "&maxRT=" + maxrt + "&minMZ=" + minmz + "&maxMZ=" + maxmz + "&limit=" + 500, true);
        xhttp.onload = () => {
            if (xhttp.readyState == 4 && xhttp.status == 200) {
                let featureData = JSON.parse(xhttp.responseText);
                Graph.currentFeatureData = featureData;
                resolve();
            }
        };
        xhttp.send();
    });
};
GraphFeature.drawFeature = (viewRange) => {
    return new Promise((resolve, reject) => {
        if ($('#featureStatus').val() != "0") {
            let promise = GraphFeature.loadMzrtData(viewRange.mzmin, viewRange.mzmax, viewRange.rtmin, viewRange.rtmax);
            promise.then(() => {
                GraphFeature.updateFeature(viewRange.mzmin, viewRange.mzmax, viewRange.rtmin, viewRange.rtmax);
                return;
            }).then(() => {
                resolve();
            });
        }
        else {
            let featureInfo = document.querySelector("#featureInfo");
            if (featureInfo) {
                featureInfo.style.display = "none";
            }
            else {
                console.error("feature table div doesn't exist");
            }
            resolve();
        }
    });
};
GraphFeature.drawFeatureNoDataLoad = (viewRange) => {
    return new Promise((resolve, reject) => {
        GraphFeature.updateFeature(viewRange.mzmin, viewRange.mzmax, viewRange.rtmin, viewRange.rtmax);
        resolve();
    });
};
GraphFeature.hideFeature = () => {
    let featureGroup = Graph.scene.getObjectByName("featureGroup");
    if (!featureGroup) {
        console.error("feature group doesn't exist");
        return;
    }
    featureGroup.visible = false;
    GraphRender.renderImmediate();
};
GraphFeature.showFeature = () => {
    let featureGroup = Graph.scene.getObjectByName("featureGroup");
    if (!featureGroup) {
        console.error("feature group doesn't exist");
        return;
    }
    featureGroup.visible = true;
    GraphRender.renderImmediate();
};
