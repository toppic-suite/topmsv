/*graph_control.js: class for scaling and repositioning objects on the graph*/
import { Line, LineBasicMaterial, Vector3, BufferGeometry, Vector2 } from '../../../lib/js/three.module.js';
import { Graph } from '../graph_init/graph.js';
import { GraphUtil } from '../graph_util/graph_util.js';
import { GraphLabel } from '../graph_util/graph_label.js';
import { GraphRender } from '../graph_control/graph_render.js';
export class GraphControl {
    constructor() { }
}
GraphControl.xScale = 1;
/******** CONVERSION FUNCTIONS *****/
/*Converts mz, rt coordinate to grid space (0 to GRID_RANGE)*/
GraphControl.mzRtToGridSpace = (mz, rt) => {
    let vr = Graph.viewRange;
    let mz_norm = (mz - vr.mzmin) / vr.mzrange;
    let rt_norm = (rt - vr.rtmin) / vr.rtrange;
    return { x: mz_norm * Graph.gridRange, z: (1 - rt_norm) * Graph.gridRange };
};
GraphControl.scaleInteToWorldUnit = (inte) => {
    return ((inte - Graph.dataRange.intmin) / (Graph.dataRange.intmax - Graph.dataRange.intmin)) * Graph.gridRange;
};
GraphControl.scaleWorldUnitToInte = (worldUnit) => {
    return ((worldUnit / Graph.gridRange) * (Graph.dataRange.intmax - Graph.dataRange.intmin)) + Graph.dataRange.intmin;
};
/******* DATA RANGE AND VIEWING AREA ****/
GraphControl.calcIntScale = () => {
    let intScale = Graph.intSquish;
    let maxInt = Graph.viewRange.intmax;
    let scaledMaxInt = GraphControl.scaleInteToWorldUnit(maxInt);
    let inteAutoAdjust = document.querySelector("#inte-auto-adjust");
    if (inteAutoAdjust) {
        if (!inteAutoAdjust.checked) {
            return intScale;
        }
    }
    if (!Graph.isPan) {
        let ratio = maxInt / Graph.intensitySumTotal;
        if (ratio < Graph.lowInteThreshold) { //if this region mostly contains low peaks
            let newSquish = (Graph.minPeakHeight * Graph.lowInteScaleFactor) / scaledMaxInt;
            intScale = newSquish;
        }
        else {
            intScale = 1;
        }
        if (scaledMaxInt * intScale > Graph.maxPeakHeight) { // when peaks are too high
            let newSquish = Graph.maxPeakHeight / (scaledMaxInt);
            intScale = newSquish;
        }
    }
    return intScale;
};
GraphControl.adjustIntensity = (peaks) => {
    //low peak height stays the same as 0.05 until the scaled value becomes > 0.05
    //peak.height = adjusted y (current Y), peak.int = original intensity
    //let plotGroup: THREE.Object3D<THREE.Event> | undefined = Graph.scene.getObjectByName("plotGroup");
    //let plotGroup: Group | undefined = Graph.scene.getObjectByName("plotGroup");
    let plotGroup = Graph.scene.getObjectByName("plotGroup");
    if (!plotGroup) {
        console.error("cannot find plotgroup");
        return;
    }
    peaks.forEach((peak) => {
        let resultHeight = peak.int * Graph.peakScale;
        if (peak.lowPeak) {
            if (resultHeight < Graph.minPeakHeight) {
                //peak y should bce updated so that the resulting height is still 0.05
                let newY = Graph.minPeakHeight / Graph.peakScale;
                peak.height = newY;
                //@ts-ignore
                peak.geometry.attributes.position.array[4] = newY;
                peak.geometry.attributes.position.needsUpdate = true;
            }
            else {
                //when the scaled intensity would be > 0.05
                peak.height = peak.int;
                //@ts-ignore
                peak.geometry.attributes.position.array[4] = peak.height;
                peak.geometry.attributes.position.needsUpdate = true;
                peak.lowPeak = false;
            }
        }
    });
};
GraphControl.getTickHeight = () => {
    let tempDiff = Graph.viewRange.rtmax - Graph.viewRange.rtmin;
    let tickHeight = Graph.tickHeightList[0];
    for (let i = 0; i < Graph.tickHeightList.length; i++) {
        if (tempDiff / Graph.yTickNum <= Graph.tickHeightList[i] &&
            tempDiff / Graph.yTickNum > Graph.tickHeightList[i + 1]) {
            tickHeight = Graph.tickHeightList[i];
            break;
        }
    }
    return tickHeight;
};
GraphControl.getTickWidth = () => {
    let tempDiff = Graph.viewRange.mzmax - Graph.viewRange.mzmin;
    let tickWidth = Graph.tickWidthList[0];
    for (let i = 0; i < Graph.tickWidthList.length; i++) {
        if (tempDiff / Graph.xTickNum <= Graph.tickWidthList[i] &&
            tempDiff / Graph.xTickNum > Graph.tickWidthList[i + 1]) {
            tickWidth = Graph.tickWidthList[i];
            break;
        }
    }
    return tickWidth;
};
GraphControl.getXTickPosList = () => {
    let posList = new Array(Graph.xTickNum + 1);
    let tickWidth = GraphControl.getTickWidth();
    for (let i = 0; i <= Graph.xTickNum; i++) {
        // calculate the actual tick position based on the current minMz value on the xaxis
        let tickMz = 0;
        if (tickWidth < 1 && tickWidth != 0) {
            tickMz = (i * tickWidth + Graph.viewRange.mzmin) - (i * tickWidth + Graph.viewRange.mzmin) % tickWidth;
        }
        else if (tickWidth != 0) {
            tickMz = i * tickWidth + Graph.viewRange.mzmin - (i * tickWidth + Graph.viewRange.mzmin) % tickWidth;
        }
        posList[i] = tickMz;
    }
    return posList;
};
GraphControl.getYTickPosList = () => {
    let posList = new Array(Graph.yTickNum + 1);
    let tickWidth = GraphControl.getTickHeight();
    let adjustment = (tickWidth + Graph.viewRange.rtmin) % tickWidth; //deduct by same number to keep the tick interval consistent
    for (let i = 0; i <= Graph.yTickNum; i++) {
        // calculate the actual tick position based on the current minMz value on the xaxis
        let tickRt = 0;
        if (tickWidth < 1 && tickWidth != 0) {
            //tickRt = (i*tickWidth + Graph.viewRange.rtmin) - parseFloat((i*tickWidth + Graph.viewRange.rtmin)%tickWidth) ;
            tickRt = (i * tickWidth + Graph.viewRange.rtmin) - adjustment;
        }
        else if (tickWidth != 0) {
            tickRt = i * tickWidth + Graph.viewRange.rtmin - (i * tickWidth + Graph.viewRange.rtmin) % tickWidth;
        }
        posList[i] = tickRt;
    }
    return posList;
};
GraphControl.makeTick = (startMz, endMz, startRt, endRt) => {
    let ticksGroup = Graph.scene.getObjectByName("ticksGroup");
    let markMaterial = new LineBasicMaterial({ color: 0x000000 });
    let markGeoPoints = [];
    let markGeo = new BufferGeometry();
    markGeoPoints.push(new Vector3(startMz, 0, startRt));
    markGeoPoints.push(new Vector3(endMz, 0, endRt));
    markGeo.setFromPoints(markGeoPoints);
    let markLine = new Line(markGeo, markMaterial);
    if (ticksGroup) {
        ticksGroup.add(markLine);
    }
    else {
        console.error("there is no ticksgroup");
    }
};
GraphControl.makeTickLabel = (which, mz, rt) => {
    let tickLabelGroup = Graph.scene.getObjectByName("tickLabelGroup");
    let text = '';
    let xoffset = 0;
    let zoffset = 0;
    if (which == "mz") {
        text = GraphUtil.roundTo(mz, Graph.roundMz).toString();
        zoffset = 2.0;
    }
    else if (which == "rt") {
        text = GraphUtil.roundTo(rt, Graph.roundRt).toString();
        xoffset = -1.5;
        zoffset = 0.2;
    }
    let label = GraphLabel.makeTextSprite(text, { r: 0, g: 0, b: 0 }, 15);
    let gridsp = GraphControl.mzRtToGridSpace(mz, rt);
    label["position"].set(gridsp.x + xoffset, 0, gridsp.z + zoffset);
    if (tickLabelGroup) {
        tickLabelGroup.add(label);
    }
    else {
        console.error("there is no ticksgroup");
    }
};
GraphControl.drawTick = () => {
    let xTickPosList = GraphControl.getXTickPosList();
    let yTickPosList = GraphControl.getYTickPosList();
    let tickMz = -1;
    let tickRt = Graph.viewRange.rtmin;
    let rtlen = Graph.viewRange.rtrange * 0.02;
    let mzlen = Graph.viewRange.mzrange * 0.02;
    for (let i = 0; i < xTickPosList.length; i++) {
        tickMz = xTickPosList[i];
        // get the x position of the tick 
        //let peakX = (tickMz - Graph.viewRange.mzmin) * Graph.xScale;
        if (tickMz >= Graph.viewRange.mzmin && tickMz <= Graph.viewRange.mzmax) {
            GraphControl.makeTick(tickMz, tickMz, tickRt, tickRt - rtlen);
            GraphControl.makeTickLabel("mz", tickMz, tickRt);
        }
    }
    tickMz = Graph.viewRange.mzmin;
    for (let i = 0; i < yTickPosList.length; i++) {
        tickRt = yTickPosList[i];
        // get the y position of the tick 
        if (tickRt >= Graph.viewRange.rtmin && tickRt <= Graph.viewRange.rtmax) {
            GraphControl.makeTick(tickMz, tickMz - mzlen, tickRt, tickRt);
            GraphControl.makeTickLabel("rt", tickMz, tickRt);
        }
    }
};
/*resizes the renderer and camera, especially in response to a window resize*/
GraphControl.repositionPlot = (r) => {
    // This step allows points to be plotted at their normal mz,rt locations in plotPoint,
    // but keeping them in the grid. Scaling datagroup transforms the coordinate system
    // from mz,rt to GRID_RANGE. RT is also mirrored because the axis runs in the "wrong" direction.
    let mz_squish = Graph.gridRange / (r.mzmax - r.mzmin);
    let rt_squish = -Graph.gridRange / (r.rtmax - r.rtmin);
    let int_squish = GraphControl.calcIntScale();
    Graph.intSquish = int_squish;
    Graph.isPan = false; //reset the boolean determining whether to apply automatic intensity scaling
    let dataGroup = Graph.scene.getObjectByName("dataGroup");
    let markerGroup = Graph.scene.getObjectByName("markerGroup");
    let featureGroup = Graph.scene.getObjectByName("featureGroup");
    let tickLabelGroup = Graph.scene.getObjectByName("tickLabelGroup");
    let ticksGroup = Graph.scene.getObjectByName("ticksGroup");
    if (dataGroup) {
        dataGroup["scale"].set(mz_squish, int_squish, rt_squish);
        dataGroup["position"].set(-r.mzmin * mz_squish, 0, Graph.gridRange - r.rtmin * rt_squish);
    }
    if (featureGroup) {
        featureGroup["scale"].set(mz_squish, 1, rt_squish);
        featureGroup["position"].set(-r.mzmin * mz_squish, 0, Graph.gridRange - r.rtmin * rt_squish);
    }
    if (markerGroup) {
        markerGroup["scale"].set(1, 1, rt_squish);
        markerGroup["position"].set(0, 0, Graph.gridRange - r.rtmin * rt_squish);
    }
    // update tick marks
    if (tickLabelGroup) {
        GraphUtil.emptyGroup(tickLabelGroup);
    }
    if (ticksGroup) {
        GraphUtil.emptyGroup(ticksGroup);
    }
    GraphControl.drawTick();
    /*
            let markMaterial = new THREE.LineBasicMaterial({ color: 0x000000});
            // draws a tick mark at the given location
            let makeTickMark = (mzmin, mzmax, rtmin, rtmax) => {
                let markGeo = new THREE.Geometry();
                markGeo.vertices.push(new THREE.Vector3(mzmin, 0, rtmin));
                markGeo.vertices.push(new THREE.Vector3(mzmax, 0, rtmax));
                let markLine = new THREE.Line(markGeo, markMaterial);
                ticksGroup.add(markLine);
                
            };
            
            // draws a tick label for the given location
            let makeTickLabel = (which, mz, rt) => {
                let text;
                let xoffset = 0;
                let zoffset = 0;
                
                if (which == "mz") {
                    text = GraphUtil.roundTo(mz, Graph.roundMz);
                    zoffset = 2.0;
                } else if (which == "rt") {
                    
                    text = GraphUtil.roundTo(rt, Graph.roundRt);
                    xoffset = -1.5;
                    zoffset = 0.2;
                }
                
                let label = GraphLabel.makeTextSprite(text, {r:0, g:0, b:0}, 15);
                let gridsp = GraphControl.mzRtToGridSpace(mz, rt);
                label.position.set(gridsp.x + xoffset, 0, gridsp.z + zoffset);
                tickLabelGroup.add(label);
            };
        
            // calculate tick frequency
            let mzSpacing = Math.pow(10, Math.floor(Math.log(r.mzrange)/Math.log(10) - 0.5));
            let rtSpacing = Math.pow(10, Math.floor(Math.log(r.rtrange)/Math.log(10) - 0.5));
            GraphUtil.emptyGroup(ticksGroup);
        
            // properly check if floating-point "value" is a multiple
            // of "divisor" within a tolerance
            let isMultiple = (value, divisor) => {
                let rem = Math.abs(value % divisor);
                return (rem < 1e-4) || (divisor-rem < 1e-4);
            };
            // place mz marks...
            let mz, rt, long;
        
            let mzFirst = r.mzmin - (r.mzmin % mzSpacing);
            rt = r.rtmin;
            for (mz = mzFirst + mzSpacing; mz < r.mzmax; mz += mzSpacing) {
                // This little gem makes it so that tick marks that are a multiple
                // of (10 * the spacing value) are longer than the others
                long = isMultiple(mz, mzSpacing * 5);
                let rtlen = r.rtrange * (long ? 0.05 : 0.02);
                makeTickMark(mz, mz, rt, rt - rtlen);
                makeTickLabel("mz", mz, rt);
                //if (long) {
                    
                //}
            }
            // ...and rt marks
            let rtFirst = r.rtmin - (r.rtmin % rtSpacing);
            mz = r.mzmin;
            for (rt = rtFirst + rtSpacing; rt < r.rtmax; rt += rtSpacing) {
                
                long = isMultiple(rt, rtSpacing * 5);
                let mzlen = r.mzrange * (long ? 0.05 : 0.02);
                makeTickMark(mz, mz - mzlen, rt, rt);
                makeTickLabel("rt", mz, rt);
                if (long) {
                    
                }
            }*/
};
/*update labels and legend to reflect a new view range*/
GraphControl.updateViewRange = (newViewRange) => {
    Graph.viewRange = newViewRange;
    GraphControl.repositionPlot(newViewRange);
    //GraphLabel.drawDataLabels();
};
/*prevent user from going outside the data range or zooming in so far that math breaks down*/
GraphControl.constrainBoundsZoom = (newmzmin, newmzrange, newrtmin, newrtrange) => {
    //if range is too small, set to minimum range of 0.01
    if (newrtrange < 0.01) {
        newrtrange = 0.01;
    }
    if (newmzrange < 0.01) {
        newmzrange = 0.01;
    }
    //if value goes below zero in rt or mz, set to 0
    if (newmzmin < 0) {
        newmzmin = 0;
    }
    if (newrtmin < 0) {
        newrtmin = 0;
    }
    //if max value is going to go over the max mz, rt, set them to be the max value, no going over the limit
    if (newmzmin + newmzrange > Graph.dataRange.mzmax) {
        newmzrange = Graph.dataRange.mzmax - newmzmin;
    }
    if (newrtmin + newrtrange > Graph.dataRange.rtmax) {
        newrtrange = Graph.dataRange.rtmax - newrtmin;
    }
    return {
        mzmin: newmzmin, mzmax: newmzmin + newmzrange, mzrange: newmzrange,
        rtmin: newrtmin, rtmax: newrtmin + newrtrange, rtrange: newrtrange,
    };
};
GraphControl.constrainBoundsPan = (newmzmin, newmzrange, newrtmin, newrtrange) => {
    //if range is too small, set to minimum range of 0.01
    if (newrtrange < 0.01) {
        newrtrange = 0.01;
    }
    if (newmzrange < 0.01) {
        newmzrange = 0.01;
    }
    if (newmzmin < 0) {
        newmzmin = 0;
    }
    if (newrtmin < 0) {
        newrtmin = 0;
    }
    let newmzmax = newmzmin + newmzrange;
    let newrtmax = newrtmin + newrtrange;
    //if max value is going to go over the max mz, rt, set them to be the max value, no going over the limit
    if (newmzmin + newmzrange > Graph.dataRange.mzmax) {
        //no panning
        newmzmin = Graph.viewRange.mzmin;
        newmzmax = Graph.dataRange.mzmax;
        newmzrange = newmzmax - newmzmin;
    }
    if (newrtmin + newrtrange > Graph.dataRange.rtmax) {
        //no panning
        newrtmin = Graph.viewRange.rtmin;
        newrtmax = Graph.dataRange.rtmax;
        newrtrange = newrtmax - newrtmin;
    }
    return {
        mzmin: newmzmin, mzmax: newmzmax,
        rtmin: newrtmin, rtmax: newrtmax,
    };
    /*return {
      mzmin: newmzmin, mzmax: newmzmax, mzrange: newmzrange,
      rtmin: newrtmin, rtmax: newrtmax, rtrange: newrtrange,
    }*/
};
GraphControl.resizeCameraUserControl = () => {
    let size = new Vector2();
    Graph.renderer.getSize(size);
    let aspectRatio = size.x / size.y;
    let vs = Graph.viewSize;
    if (aspectRatio > 1) {
        // width greater than height; scale height to view size to fit content
        // and scale width based on the aspect ratio (this creates extra space on the sides)
        Graph.camera.left = vs * aspectRatio / -2;
        Graph.camera.right = vs * aspectRatio / 2;
        Graph.camera.top = vs / 2;
        Graph.camera.bottom = vs / -2;
    }
    else { // height greater than width; same as above but with top+bottom switched with left+right
        Graph.camera.left = vs / -2;
        Graph.camera.right = vs / 2;
        Graph.camera.top = vs / aspectRatio / 2;
        Graph.camera.bottom = vs / aspectRatio / -2;
    }
    // render the view to show the changes
    Graph.camera.updateProjectionMatrix();
    GraphRender.renderImmediate();
    Graph.resizedCamera = Graph.camera;
};
GraphControl.resizeCamera = () => {
    let graphEl = Graph.graphEl;
    if (!graphEl) {
        console.error("no graph element");
        return;
    }
    Graph.renderer.setSize(graphEl.clientWidth, graphEl.clientHeight, true);
    let size = new Vector2();
    Graph.renderer.getSize(size);
    let aspectRatio = size.x / size.y;
    let vs = Graph.viewSize;
    if (aspectRatio > 1) {
        // width greater than height; scale height to view size to fit content
        // and scale width based on the aspect ratio (this creates extra space on the sides)
        Graph.camera.left = vs * aspectRatio / -2;
        Graph.camera.right = vs * aspectRatio / 2;
        Graph.camera.top = vs / 2;
        Graph.camera.bottom = vs / -2;
    }
    else {
        // height greater than width; same as above but with top+bottom switched with left+right
        Graph.camera.left = vs / -2;
        Graph.camera.right = vs / 2;
        Graph.camera.top = vs / aspectRatio / 2;
        Graph.camera.bottom = vs / aspectRatio / -2;
    }
    // render the view to show the changes
    Graph.camera.updateProjectionMatrix();
    GraphRender.renderImmediate();
    Graph.resizedCamera = Graph.camera;
};
