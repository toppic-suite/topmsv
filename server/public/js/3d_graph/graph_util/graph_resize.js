/*expand/reduce graph div size when a button is clicked */
import { Graph } from '../graph_init/graph.js';
import { GraphControl } from '../graph_control/graph_control.js';
export class GraphResize {
    constructor() {
        this.oriWidth = '';
        this.oriHeight = '';
        this.oriViewSize = 0;
        this.viewSize = Graph.viewSize;
        this.viewAdjust = 3;
        this.isFullScreen = false;
        /*graph div resizing*/
        this.expandGraph = () => {
            Graph.viewSize = Graph.viewSize - this.viewAdjust;
            GraphControl.resizeCameraUserControl();
        };
        this.shrinkGraph = () => {
            Graph.viewSize = Graph.viewSize + this.viewAdjust;
            GraphControl.resizeCameraUserControl();
        };
        this.fullScreen = () => {
            let parameterDiv = document.querySelector('[id="3d-graph-parameter"]');
            let centerDiv = document.querySelector("#center-div");
            let graphDiv = document.querySelector("#graph-container");
            let graphEl = Graph.graphEl;
            if (!parameterDiv || !centerDiv || !graphDiv) {
                console.error(`cannot find graph div! #3d-graph-parameter: ${parameterDiv} #center-div: ${centerDiv} #graph-container: ${graphDiv}`);
                return;
            }
            if (!graphEl) {
                console.error("there is no div container for graph");
                return;
            }
            if (this.isFullScreen) { //shrink back
                document.body.style.width = this.oriWidth;
                centerDiv.style.paddingLeft = "60px";
                centerDiv.style.paddingRight = "60px";
                graphDiv.style.height = this.oriHeight;
                parameterDiv.scrollIntoView();
                parameterDiv.scrollIntoView(false);
                parameterDiv.scrollIntoView({ block: "end" });
                Graph.renderer.setSize(graphEl.clientWidth, parseFloat(this.oriHeight), true);
                this.isFullScreen = false;
            }
            else { //expand to full screen
                this.oriWidth = centerDiv.style.width;
                this.oriHeight = graphEl.clientHeight.toString();
                centerDiv.style.padding = "0px";
                document.body.style.width = "100%";
                parameterDiv.scrollIntoView();
                parameterDiv.scrollIntoView(false);
                parameterDiv.scrollIntoView({ block: "start" });
                this.isFullScreen = true;
                Graph.renderer.setSize(window.innerWidth, window.innerHeight, true);
            }
        };
        this.main = () => {
            let graphExpand = document.querySelector("#graph-expand");
            let graphShrink = document.querySelector("#graph-shrink");
            let graphFull = document.querySelector("#graph-full-screen");
            if (graphExpand) {
                graphExpand.addEventListener("click", this.expandGraph, false);
            }
            else {
                console.error("no button exists to expand the 3d view");
            }
            if (graphShrink) {
                graphShrink.addEventListener("click", this.shrinkGraph, false);
            }
            else {
                console.error("no button exists to shrink the 3d view");
            }
            if (graphFull) {
                graphFull.addEventListener("click", this.fullScreen, false);
            }
            else {
                console.error("no button exists to show the 3d view in full screen");
            }
        };
    }
    ;
}
