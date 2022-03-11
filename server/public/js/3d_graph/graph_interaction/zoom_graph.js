/*zoomGraph.js : class defining zoom behavior on the graph
zoom in and zoom out on x and y axis by scrolling mouse wheel
peak intensity is also adjusted by ctrl + mouse wheel
*/
import { Graph } from '../graph_init/graph.js';
import { GraphRender } from '../graph_control/graph_render.js';
import { GraphControl } from '../graph_control/graph_control.js';
import { GraphData } from '../graph_data/graph_data.js';
import { GraphUtil } from '../graph_util/graph_util.js';
export class GraphZoom {
    constructor() {
        this.scrollLock = false;
        this.adjustPeakHeight = (scaleFactor) => {
            let peaks = Graph.scene.getObjectByName("plotGroup");
            if (!peaks) {
                console.error("plotGroup cannot be found");
                return;
            }
            let oriScale = peaks["scale"]["y"];
            peaks["scale"].set(peaks["scale"]["x"], oriScale * scaleFactor, peaks["scale"]["z"]);
            if (scaleFactor > 1) {
                GraphControl.adjustIntensity(peaks.children);
            }
            GraphRender.renderImmediate();
        };
        this.onZoom = async (e) => {
            e.preventDefault(); //disable scroll of browser
            if (!this.scrollLock) {
                this.scrollLock = true;
                let scaleFactor = 0;
                if (e.deltaY > 0) {
                    scaleFactor = 0.75;
                }
                else if (e.deltaY < 0) {
                    scaleFactor = 1.5;
                }
                if (e.ctrlKey) { //if control key is pressed --> intensity zoom
                    this.adjustPeakHeight(scaleFactor);
                }
                else {
                    this.onZoomFromEventListener(e);
                }
                this.scrollLock = false;
            }
        };
        this.onZoomFromEventListener = async (e) => {
            //zoom action detected by event listener in each axis
            let scaleFactor = 0;
            let mousePos = GraphUtil.getMousePosition(e);
            let newmzrange = Graph.viewRange.mzrange;
            let newrtrange = Graph.viewRange.rtrange;
            let curmz = mousePos.x * Graph.viewRange.mzrange + Graph.viewRange.mzmin; //current mz and rt that has a cursor pointed to
            let currt = mousePos.z * Graph.viewRange.rtrange + Graph.viewRange.rtmin;
            let axisName = '';
            //reset view range based on scroll up or down
            if (e.deltaY < 0) {
                scaleFactor = 0.8;
            }
            else {
                scaleFactor = 1.2;
            }
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
