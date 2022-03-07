/*graph_util.js: class for utility functions used throughout the 3d graph*/
import { Raycaster, Vector3 } from '../../../lib/js/three.module.js';
import { Graph } from '../graph_init/graph.js';
export class GraphUtil {
    constructor() { }
}
GraphUtil.disposeObject = (obj) => {
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
};
GraphUtil.emptyGroup = (g) => {
    while (g.children.length > 0) {
        let obj = g.children.pop();
        GraphUtil.disposeObject(obj);
    }
};
GraphUtil.formatScientificNotation = (intensity) => {
    let sciNumber = intensity.toExponential(Graph.resultViz.getConfig().scientificDigit);
    return sciNumber;
};
GraphUtil.formatFloat = (num) => {
    if (typeof num == "number") {
        return num.toFixed(Graph.resultViz.getConfig().floatDigit);
    }
    else if (typeof num == "string") {
        if (isNaN(parseFloat(num))) {
            return '';
        }
        else {
            return parseFloat(num).toFixed(Graph.resultViz.getConfig().floatDigit);
        }
    }
    return '';
};
GraphUtil.updateTextBox = () => {
    //update data range in textboxes if getting range from each scan, not by users
    let centerRT = (Graph.viewRange.rtmax + Graph.viewRange.rtmin) / 2;
    let rangeRT = Graph.viewRange.rtmax - centerRT;
    let centerMZ = (Graph.viewRange.mzmax + Graph.viewRange.mzmin) / 2;
    let rangeMZ = Graph.viewRange.mzmax - centerMZ;
    let rtRangeMin = document.querySelector('#rtRangeMin');
    let rtRangeMax = document.querySelector('#rtRangeMax');
    let mzRangeMin = document.querySelector('#mzRangeMin');
    let mzRangeMax = document.querySelector('#mzRangeMax');
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
};
GraphUtil.roundTo = (number, places) => {
    let power = Math.pow(10, places);
    return Math.round(number * power) / power;
};
GraphUtil.sortByRT = (a, b) => {
    const rtA = parseFloat(a.RETENTIONTIME);
    const rtB = parseFloat(b.RETENTIONTIME);
    let comparison = 0;
    if (rtA > rtB) {
        comparison = 1;
    }
    else if (rtA < rtB) {
        comparison = -1;
    }
    return comparison;
};
/*related to mouse interaction*/
GraphUtil.findObjectHover = (event, objGroup) => {
    let el = Graph.renderer.domElement;
    let canvasPosition = Graph.renderer.domElement.getBoundingClientRect();
    //find mouse position, normalized to a [-1,1] in both x/y-axes on screen
    let coord = {
        x: ((event.clientX - canvasPosition.left) / el.offsetWidth) * 2 - 1,
        y: -((event.clientY - canvasPosition.top) / el.offsetHeight) * 2 + 1
    };
    let raycaster = new Raycaster();
    raycaster.setFromCamera(coord, Graph.camera);
    let intersects = raycaster.intersectObjects(objGroup.children);
    if (intersects.length > 0) {
        return intersects[0].object;
    }
    else {
        return null;
    }
};
GraphUtil.getMousePosition = (event) => {
    let el = Graph.renderer.domElement;
    let canvasPosition = Graph.renderer.domElement.getBoundingClientRect();
    //find mouse position, normalized to a [-1,1] in both x/y-axes on screen
    let coord = {
        x: ((event.clientX - canvasPosition.left) / el.offsetWidth) * 2 - 1,
        y: -((event.clientY - canvasPosition.top) / el.offsetHeight) * 2 + 1
    };
    let raycaster = new Raycaster();
    raycaster.setFromCamera(coord, Graph.camera);
    let pos = new Vector3(0, 1, 0);
    raycaster.ray.intersectPlane(Graph.graphPlane, pos);
    if (pos) {
        //convert world coordinates to graph-fractional coordinates
        pos.multiply(Graph.rangeTransform);
        pos.z = 1 - pos.z;
    }
    return pos;
};
GraphUtil.getMzRtCoordinate = (event) => {
    let mousePos = GraphUtil.getMousePosition(event);
    let mz = mousePos.x * Graph.viewRange.mzrange + Graph.viewRange.mzmin; //current mz and rt that has a cursor pointed to
    let rt = mousePos.z * Graph.viewRange.rtrange + Graph.viewRange.rtmin;
    if (mz < Graph.viewRange.mzmin) {
        mz = -1;
    }
    else if (mz > Graph.viewRange.mzmax) {
        mz = -1;
    }
    else {
        mz = parseFloat(mz.toFixed(3));
    }
    if (rt < Graph.viewRange.rtmin) {
        rt = -1;
    }
    else if (rt > Graph.viewRange.rtmax) {
        rt = -1;
    }
    else {
        rt = parseFloat(rt.toFixed(3));
    }
    return [mz, rt];
};
GraphUtil.findNearestRt = (rt) => {
    let rtScanData = Graph.resultViz.getRtInteGraph().inteRtArray;
    let threshold = Graph.viewRange.rtrange / 100;
    for (let i = 0; i < rtScanData.length; i++) {
        let diff = Math.abs(parseFloat(rtScanData[i].rt.toFixed(5)) - parseFloat((rt).toFixed(5)));
        if (diff < threshold) {
            return rtScanData[i].rt;
        }
    }
    return -1;
};
GraphUtil.findNearestScan = (rt) => {
    let rtScanData = Graph.resultViz.getRtInteGraph().inteRtArray;
    let threshold = Graph.viewRange.rtrange / 100;
    for (let i = 0; i < rtScanData.length; i++) {
        let diff = Math.abs(parseFloat(rtScanData[i].rt.toFixed(5)) - parseFloat((rt).toFixed(5)));
        if (diff < threshold) {
            return rtScanData[i].scanNum;
        }
    }
    return -1;
};
GraphUtil.findIonTime = (rt) => {
    let rtScanData = Graph.resultViz.getRtInteGraph().inteRtArray;
    let threshold = Graph.viewRange.rtrange / 100;
    if ('ionTime' in rtScanData[0]) {
        for (let i = 0; i < rtScanData.length; i++) {
            let diff = Math.abs(parseFloat(rtScanData[i].rt.toFixed(5)) - parseFloat((rt).toFixed(5)));
            if (diff < threshold) {
                return rtScanData[i].ionTime;
            }
        }
        return -1;
    }
    else {
        return -1;
    }
};
GraphUtil.getTotalScanCount = async () => {
    let fullDir = Graph.projectDir;
    let res = await fetch('/getTotalScanCount?' + new URLSearchParams({
        projectDir: fullDir
    }));
    let resJSON = await res.json();
    return resJSON.COUNT;
};
GraphUtil.addPaddingToFeature = (rt) => {
    let rt_row = rt * (1 - Graph.featurePadding);
    let rt_high = rt * (1 + Graph.featurePadding);
    return [rt_row, rt_high];
};
