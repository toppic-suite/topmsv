/*graph_data.js : draws and manages the peaks on the screen*/
import { Graph } from '../graph_init/graph.js';
import { GraphControl } from '../graph_control/graph_control.js';
import { GraphRender } from '../graph_control/graph_render.js';
import { GraphFeature } from '../graph_data/graph_feature.js';
import { GraphLabel } from '../graph_util/graph_label.js';
import { GraphUtil } from '../graph_util/graph_util.js';
import { LoadData } from '../graph_data/load_data.js';
export class GraphData {
    constructor() { }
}
/******** ADD HORIZONTAL MARKER FOR WHERE CURRENT SCANS ARE ******/
GraphData.drawCurrentScanMarker = () => {
    let markerGroup = Graph.scene.getObjectByName("markerGroup");
    if (markerGroup) {
        markerGroup.children.forEach(function (line) {
            line.position.set(0, 0.01, Graph.curRT);
            line.visible = true;
        });
    }
};
/******** CALCULATE AND SET DATA RANGE ******/
GraphData.getInteRange = (points) => {
    let intmin = Infinity;
    let intmax = 0;
    Graph.intensitySum = 0;
    for (let i = 0; i < points.length; i++) {
        if (points[i].INTENSITY < intmin) {
            intmin = points[i].INTENSITY;
        }
        if (points[i].INTENSITY > intmax) {
            intmax = points[i].INTENSITY;
        }
        Graph.intensitySum = Graph.intensitySum + points[i].INTENSITY;
    }
    if (Graph.intensitySumTotal < 0) {
        Graph.intensitySumTotal = Graph.intensitySum;
    }
    Graph.viewRange.intmin = intmin;
    Graph.viewRange.intmax = intmax;
    Graph.viewRange.intrange = intmax - intmin;
};
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
  }*/ /*
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
GraphData.setViewRange = (mzmin, mzmax, rtmax, rtmin, curRT) => {
    let dataTotal = Graph.configData[0];
    if (rtmax > dataTotal.RTMAX) {
        rtmax = dataTotal.RTMAX;
    }
    if (rtmin < 0) {
        rtmin = 0;
    }
    /*if (mzmax > dataTotal.MZMAX){
        mzmax = dataTotal.MZMAX;
    }*/
    if (mzmin < 0) {
        mzmin = 0;
    }
    Graph.curRT = curRT;
    Graph.viewRange.mzmin = mzmin;
    Graph.viewRange.mzmax = mzmax;
    Graph.viewRange.mzrange = mzmax - mzmin;
    Graph.viewRange.rtmin = rtmin;
    Graph.viewRange.rtmax = rtmax;
    Graph.viewRange.rtrange = rtmax - rtmin;
};
GraphData.setViewRangeForNewScan = (curRT) => {
    let dataTotal = Graph.configData[0];
    let rtInterval = (dataTotal.RTMAX - dataTotal.RTMIN) / Graph.ms1ScanCount;
    Graph.curRT = curRT;
    Graph.viewRange.mzmin = 0;
    Graph.viewRange.mzmax = dataTotal.MZMAX;
    Graph.viewRange.mzrange = dataTotal.MZMAX;
    Graph.viewRange.rtmin = curRT - (rtInterval * Graph.scanDisplayed / 2);
    Graph.viewRange.rtmax = curRT + (rtInterval * Graph.scanDisplayed / 2);
    Graph.viewRange.rtrange = Graph.viewRange.rtmax - Graph.viewRange.rtmin;
};
GraphData.setViewRangeToFull = () => {
    Graph.viewRange.mzmin = 0;
    Graph.viewRange.mzmax = Graph.dataRange.mzmax;
    Graph.viewRange.mzrange = Graph.dataRange.mzmax;
    Graph.viewRange.rtmin = 0;
    Graph.viewRange.rtmax = Graph.dataRange.rtmax;
    Graph.viewRange.rtrange = Graph.dataRange.rtmax;
};
/******** PLOT PEAKS ******/
GraphData.updateGraph = async (mzmin, mzmax, rtmin, rtmax, curRT) => {
    GraphData.setViewRange(mzmin, mzmax, rtmax, rtmin, curRT);
    await GraphData.draw(curRT);
    /*if (Graph.isUpdateTextBox){
        GraphUtil.updateTextBox();
    }*/
};
GraphData.updateGraphNoNewData = (mzmin, mzmax, rtmin, rtmax, curRT) => {
    GraphData.setViewRange(mzmin, mzmax, rtmax, rtmin, curRT);
    GraphData.drawNoNewData(curRT);
    /*if (Graph.isUpdateTextBox){
        GraphUtil.updateTextBox();
    }*/
};
GraphData.drawFullRangeGraph = (scanID) => {
    let promise = LoadData.getRT(scanID);
    promise.then((rt) => {
        Graph.curRT = rt;
        GraphData.setViewRangeToFull();
        GraphData.draw(Graph.curRT);
        /*if (Graph.isUpdateTextBox){
            GraphUtil.updateTextBox();
        }*/
    });
};
/*static drawInitGraph = (mzmin, mzmax, scanID) => {
    let promise = LoadData.getRT(scanID);
    promise.then(async(curRT) =>{
        GraphData.setInitViewRange(mzmin, mzmax, curRT);
        await GraphData.draw(curRT);
        /*if (Graph.isUpdateTextBox){
            GraphUtil.updateTextBox();
        }*/ /*
})
}*/
GraphData.updateGraphForNewScan = (scanID) => {
    let promise = LoadData.getRT(scanID);
    promise.then(async (curRT) => {
        GraphData.setViewRangeForNewScan(curRT);
        await GraphData.draw(curRT);
    });
};
/******** PLOT PEAKS ******/
GraphData.draw = async (curRT = Graph.curRT) => {
    const curViewRange = Graph.viewRange;
    Graph.curRT = curRT;
    Graph.currentData = await LoadData.load3dData(curViewRange);
    GraphData.getInteRange(Graph.currentData);
    //if camera angle is perpendicular to the graph plane
    if (Graph.isPerpendicular) {
        await GraphData.plotPoint2D();
    }
    else {
        await GraphData.updatePeaks(Graph.currentData);
    }
    Graph.viewRange["intscale"] = 1;
    // make sure the groups are plotted and update the view
    if (Graph.curRT <= Graph.viewRange.rtmax && Graph.curRT >= Graph.viewRange.rtmin) {
        if ($("#highlight-cur-scan").prop("checked")) {
            await GraphData.drawCurrentScanMarker();
        }
    }
    else {
        let markerGroup = Graph.scene.getObjectByName("markerGroup");
        if (markerGroup) {
            markerGroup.children.forEach(function (line) {
                line.visible = false;
            });
        }
        else {
            console.error("there is no markergroup");
        }
    }
    GraphLabel.displayGraphData(Graph.currentData.length); //display metadata about the graph
    await GraphFeature.drawFeature(Graph.viewRange);
    GraphControl.updateViewRange(Graph.viewRange);
    GraphRender.renderImmediate();
};
GraphData.drawNoNewData = async (checkIntensity) => {
    //if camera angle is perpendicular to the graph plane
    if (Graph.isPerpendicular) {
        GraphData.plotPoint2D();
    }
    else {
        await GraphData.updatePeaks(Graph.currentData);
    }
    Graph.viewRange["intscale"] = 1;
    // make sure the groups are plotted and update the view
    if (Graph.curRT <= Graph.viewRange.rtmax && Graph.curRT >= Graph.viewRange.rtmin) {
        if ($("#highlight-cur-scan").prop("checked")) {
            GraphData.drawCurrentScanMarker();
        }
    }
    else {
        let markerGroup = Graph.scene.getObjectByName("markerGroup");
        if (markerGroup) {
            markerGroup.children.forEach(function (line) {
                line.visible = false;
            });
        }
        else {
            console.error("there is no markergroup");
        }
    }
    GraphLabel.displayGraphData(Graph.currentData.length); //display metadata about the graph
    await GraphFeature.drawFeatureNoDataLoad(Graph.viewRange);
    GraphControl.updateViewRange(Graph.viewRange, checkIntensity);
    GraphRender.renderImmediate();
};
GraphData.plotPoint2D = () => {
    let prevSpecRT = 0;
    let prevPeakRT = 0;
    let curRt = parseFloat(Graph.curRT.toFixed(4));
    //let rt = document.getElementById("scan1RT").innerText;
    let dataGroup = Graph.scene.getObjectByName("dataGroup");
    let peak2DGroup = Graph.peak2DGroup;
    if (!dataGroup) {
        console.error("datagroup doesn't exist");
        return;
    }
    //sort data by rt
    Graph.currentData.sort(GraphUtil.sortByRT);
    if (Graph.currentData.length > 0) {
        prevPeakRT = parseFloat(Graph.currentData[Graph.currentData.length - 1].RETENTIONTIME);
    }
    //@ts-ignore //peak2D group contains objects in the type Peak3DView
    peak2DGroup.children.forEach(function (line, index) {
        if (index < Graph.currentData.length) {
            let point = Graph.currentData[Graph.currentData.length - 1 - index];
            let mz = parseFloat(point.MZ);
            let inte = parseFloat(point.INTENSITY);
            let rt = parseFloat(point.RETENTIONTIME);
            if (mz >= Graph.viewRange.mzmin && mz <= Graph.viewRange.mzmax &&
                rt >= Graph.viewRange.rtmin && rt <= Graph.viewRange.rtmax) {
                let lineColor = Graph.peakColor[point.COLOR];
                //ySize is current retention time - prevRT
                //for the first spectra peaks, it is a set length;
                //while current peak has same RT as the previous peak, keep iterating
                //if current peak has different RT as the previous peak, update prevRT as the previous peak RT
                if (rt != prevPeakRT) {
                    prevSpecRT = prevPeakRT;
                }
                let ySize = prevSpecRT - rt; //peak length
                let rtRange = Graph.viewRange.rtmax - Graph.viewRange.rtmin;
                let minSize = rtRange / 60;
                //for special cases when should not be using the calculated ysize value
                if (ySize < minSize) { //minimum length for the peak
                    ySize = minSize;
                }
                if (prevSpecRT == 0) { //when it is the spectra peaks with the highets rt (no previous spectra)
                    ySize = rtRange / (2 * 60);
                }
                //@ts-ignore //allow overwrite
                line.geometry.attributes.position.array[5] = ySize;
                line.geometry.attributes.position.needsUpdate = true;
                line.material.color.setStyle(lineColor);
                if (parseFloat(rt.toFixed(4)) == curRt && Graph.isHighlightingCurrentScan) {
                    line.material.color.setStyle(Graph.currentScanColor);
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
            else {
                line.visible = false;
            }
        }
        else {
            line.visible = false;
        }
        // Reposition the plot so that mzmin,rtmin is at the correct corner
        dataGroup.add(peak2DGroup);
    });
};
GraphData.updatePeaks = (data) => {
    let plotGroup = Graph.scene.getObjectByName("plotGroup");
    if (!plotGroup) {
        console.error("plotgroup doesn't exist");
        return;
    }
    //iterate through peask in plot group while < data.length;
    //for the rest of peaks, turn off visibility
    //@ts-ignore //peak2D group contains objects in the type Peak3DView
    plotGroup.children.forEach(function (line, index) {
        if (index < data.length) {
            let point = data[index];
            let id = point.ID;
            let mz = parseFloat(point.MZ);
            let rt = parseFloat(point.RETENTIONTIME);
            let inten = parseFloat(point.INTENSITY);
            let lineColor = Graph.peakColor[point.COLOR];
            let intScale = GraphControl.calcIntScale();
            if (mz >= Graph.viewRange.mzmin && mz <= Graph.viewRange.mzmax &&
                rt >= Graph.viewRange.rtmin && rt <= Graph.viewRange.rtmax) {
                let lowPeak = false;
                let currt = Graph.curRT.toFixed(4);
                let y = inten;
                //if y is much smaller than the highest intensity peak in the view range
                if (y * plotGroup.scale.y * intScale < Graph.minPeakHeight) {
                    //increase y so that later y is at least minHeight when scaled
                    y = Graph.minPeakHeight / (plotGroup.scale.y * intScale);
                    lowPeak = true;
                }
                //@ts-ignore to allow overwrite
                line.geometry.attributes.position.array[4] = y;
                line.geometry.attributes.position.needsUpdate = true;
                line.material.color.setStyle(lineColor);
                if (rt.toFixed(4) == currt && Graph.isHighlightingCurrentScan) {
                    line.material.color.setStyle(Graph.currentScanColor);
                }
                line.position.set(mz, 0, rt);
                line.pointid = id;
                line.mz = mz;
                line.rt = rt;
                line.int = inten;
                line.height = y;
                line.name = "peak";
                line.visible = true;
                if (lowPeak) {
                    line.lowPeak = true;
                }
                else {
                    line.lowPeak = false;
                }
            }
            else {
                line.visible = false;
            }
        }
        else {
            line.visible = false;
            line.lowPeak = false;
        }
    });
};
