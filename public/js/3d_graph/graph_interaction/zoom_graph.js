"use strict";
/*zoomGraph.js : class defining zoom behavior on the graph
zoom in and zoom out on x and y axis by scrolling mouse wheel
peak intensity is also adjusted by ctrl + mouse wheel
*/
class GraphZoom {
    constructor() {
        this.scrollLock = false;
        this.adjustPeakHeight = (scaleFactor, isTempScale) => {
            let peaks = Graph.scene.getObjectByName("plotGroup");
            if (!peaks) {
                console.error("plotGroup cannot be found");
                return;
            }
            if (!isTempScale) {
                let oriScale = peaks.scale.y;
                peaks.scale.set(peaks.scale.x, oriScale * scaleFactor, peaks.scale.z);
                Graph.peakScale = oriScale * scaleFactor;
            }
            //if (scaleFactor > 1){}
            //@ts-ignore "peaks" contain a group of Peak3DView
            GraphControl.adjustIntensity(peaks.children, isTempScale);
            if (isTempScale) {
                //@ts-ignore "peaks" contain a group of Peak3DView
                GraphControl.postProcessLowPeaks(peaks.children);
            }
            GraphRender.renderImmediate();
        };
        this.onZoom = async (e) => {
            e.preventDefault(); //disable scroll of browser
            if (!this.scrollLock) {
                this.scrollLock = true;
                let axis = GraphUtil.findObjectHover(e, Graph.axisGroup); //axis is null if cursor is not on axis
                if (axis == null) {
                    let scaleFactor = 0;
                    if (e.deltaY > 0) {
                        scaleFactor = 0.75;
                    }
                    else if (e.deltaY < 0) {
                        scaleFactor = 1.5;
                    }
                    if (e.ctrlKey) { //if control key is pressed --> intensity zoom
                        this.adjustPeakHeight(scaleFactor, false);
                    }
                    else {
                        await this.onZoomFromEventListener(e, null);
                        this.adjustPeakHeight(scaleFactor, true);
                    }
                }
                else {
                    let scaleFactor = 0;
                    if (e.deltaY > 0) {
                        scaleFactor = 0.75;
                    }
                    else if (e.deltaY < 0) {
                        scaleFactor = 1.5;
                    }
                    if (e.ctrlKey) { //if control key is pressed --> intensity zoom
                        this.adjustPeakHeight(scaleFactor, false);
                    }
                    else {
                        if (axis.name == "xAxis") {
                            await this.onZoomFromEventListener(e, "mz");
                        }
                        else if (axis.name == "yAxis") {
                            await this.onZoomFromEventListener(e, "rt");
                        }
                        this.adjustPeakHeight(scaleFactor, true);
                    }
                }
                this.scrollLock = false;
            }
        };
        this.onZoomFromEventListener = async (e, axisName) => {
            //zoom action detected by event listener in each axis
            let scaleFactor = 0;
            let mousePos = GraphUtil.getMousePosition(e);
            let newmzrange = Graph.viewRange.mzrange;
            let newrtrange = Graph.viewRange.rtrange;
            let curmz = mousePos.x * Graph.viewRange.mzrange + Graph.viewRange.mzmin; //current mz and rt that has a cursor pointed to
            let currt = mousePos.z * Graph.viewRange.rtrange + Graph.viewRange.rtmin;
            //reset view range based on scroll up or down
            if (e.deltaY < 0) {
                scaleFactor = 0.8;
            }
            else {
                scaleFactor = 1.2;
            }
            if (axisName == null) {
                if (curmz >= Graph.viewRange.mzmin && curmz <= Graph.viewRange.mzmax) {
                    if (currt >= Graph.viewRange.rtmin && currt <= Graph.viewRange.rtmax) {
                        axisName = "both";
                    }
                    else {
                        axisName = "mz";
                    }
                }
                else if (currt >= Graph.viewRange.rtmin && currt <= Graph.viewRange.rtmax) {
                    if (curmz <= Graph.viewRange.mzmin && curmz >= Graph.viewRange.mzmin) {
                        axisName = "both";
                    }
                    else {
                        axisName = "rt";
                    }
                }
            }
            //figure out where the cursor is (near x axis, y axis)
            if (axisName == "rt") {
                newrtrange = Graph.viewRange.rtrange * scaleFactor;
            }
            else if (axisName == "mz") { //mz range adjust
                newmzrange = Graph.viewRange.mzrange * scaleFactor;
            }
            else if (axisName == "both") { //if adjusting both
                newrtrange = Graph.viewRange.rtrange * scaleFactor;
                newmzrange = Graph.viewRange.mzrange * scaleFactor;
            }
            else {
                return;
            }
            let mzscale = (curmz - Graph.viewRange.mzmin) / (Graph.viewRange.mzmax - Graph.viewRange.mzmin); //find relative pos of current mz currrent rt
            let rtscale = (currt - Graph.viewRange.rtmin) / (Graph.viewRange.rtmax - Graph.viewRange.rtmin);
            let newmzmin = curmz - (mzscale * newmzrange); //the closer curmz or currt is to the minmz and minrt, the less change in min value
            let newrtmin = currt - (rtscale * newrtrange);
            let newRange = GraphControl.constrainBoundsZoom(newmzmin, newmzrange, newrtmin, newrtrange);
            /*if (newRange.rtmax - newRange.rtmin < 0.35) {//prevent rt range becoming too small
                newRange.rtmax = newRange.rtmin + 0.35;
            }*/
            GraphControl.xScale = scaleFactor;
            await GraphData.updateGraph(newRange.mzmin, newRange.mzmax, newRange.rtmin, newRange.rtmax, Graph.curRT);
        };
    }
    main() {
        Graph.renderer.domElement.addEventListener('wheel', this.onZoom, false);
    }
}
