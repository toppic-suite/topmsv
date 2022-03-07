/*hover_positon.js: display m/z and rt information of the point the mouse cursor is on */
import { Graph } from '../graph_init/graph.js';
import { GraphUtil } from '../graph_util/graph_util.js';
export class HoverPosition {
    constructor() {
        this.showHighlight = (mz, rt, event) => {
            //disdlay a line and a scan information in tooltip
            let scanNum = GraphUtil.findNearestScan(rt);
            let sep = "</br>";
            let tooltip = document.querySelector("#tooltip-scanID");
            let tooltipText = document.querySelector("#tooltiptext-scanID");
            if (scanNum >= 0) {
                if (tooltip) {
                    tooltip.style.display = "inline-block";
                    tooltip.style.top = (event.clientY - 70) + 'px';
                    tooltip.style.left = (event.clientX + 20) + 'px';
                }
                else {
                    console.error("there is no tooltip element");
                }
                if (tooltipText) {
                    tooltipText.innerHTML = "scan: " + scanNum + sep + "mz: " + GraphUtil.formatFloat(mz) + sep + "rt: " + GraphUtil.formatFloat(rt) + sep;
                }
                else {
                    console.error("there is no tooltipText element");
                }
            }
            else {
                if (tooltip) {
                    tooltip.style.display = "none";
                }
            }
        };
        this.onMouseOver = (event) => {
            let [mz, rt] = GraphUtil.getMzRtCoordinate(event);
            let scan = GraphUtil.findNearestScan(rt);
            let ionTime = GraphUtil.findIonTime(rt);
            let mzString, rtString, scanString, ionTimeString = '';
            let cursorData = "";
            let tooltip = document.querySelector("#tooltip-scanID");
            let graphCursorData = document.querySelector("#graph-cursor-data");
            if (mz < 0 || rt < 0) {
                mzString = "";
                rtString = "";
            }
            else {
                mzString = mz.toString();
                rtString = rt.toString();
                if (event.ctrlKey) {
                    this.showHighlight(mz, rt, event);
                }
                else {
                    if (tooltip) {
                        tooltip.style.display = "none";
                    }
                }
            }
            if (scan < 0) {
                scanString = "n/a";
            }
            else {
                scanString = scan.toString();
            }
            if (ionTime != null) {
                ionTimeString = ionTime.toFixed(3);
                if (ionTime < 0) {
                    ionTimeString = "n/a";
                }
                cursorData = "m/z: " + GraphUtil.formatFloat(mzString) + "\n" + "retention time (min): " + GraphUtil.formatFloat(rtString) + "\n" + "ion injection time (ms): " + GraphUtil.formatFloat(ionTimeString) + "\n" + "scan ID: " + scanString;
            }
            else {
                cursorData = "m/z: " + GraphUtil.formatFloat(mzString) + "\n" + "retention time (min): " + GraphUtil.formatFloat(rtString) + "\n" + "scan ID: " + scanString;
            }
            if (graphCursorData) {
                graphCursorData.innerText = cursorData;
            }
            else {
                console.error("graph-cursor-data doesn't exist");
            }
        };
        this.main = () => {
            Graph.renderer.domElement.addEventListener('mousemove', this.onMouseOver, false);
        };
    }
    ;
}
