"use strict";
/*pan_graph.js: on click and drag, move the peaks based on the rt mz range*/
class GraphPan {
    constructor() {
        this.panView = (x, z) => {
            Graph.isPan = true;
            let viewRange = Graph.viewRange;
            let mzmin = viewRange.mzmin + (x * viewRange.mzrange);
            let rtmin = viewRange.rtmin + (z * viewRange.rtrange);
            let newRange = GraphControl.constrainBoundsPan(mzmin, viewRange.mzrange, rtmin, viewRange.rtrange);
            GraphData.updateGraph(newRange.mzmin, newRange.mzmax, newRange.rtmin, newRange.rtmax, Graph.curRT);
        };
        this.panViewNoNewData = (x, z) => {
            Graph.isPan = true;
            let viewRange = Graph.viewRange;
            let mzmin = viewRange.mzmin + (x * viewRange.mzrange);
            let rtmin = viewRange.rtmin + (z * viewRange.rtrange);
            let newRange = GraphControl.constrainBoundsPan(mzmin, viewRange.mzrange, rtmin, viewRange.rtrange);
            GraphData.updateGraphNoNewData(newRange.mzmin, newRange.mzmax, newRange.rtmin, newRange.rtmax, Graph.curRT);
        };
        this.onMouseDown = (e) => {
            this.mouseDown = true;
            Graph.isZoom = false;
            if (e.button === 0) {
                let mousePoint = GraphUtil.getMousePosition(e);
                if (mousePoint === null) {
                    return;
                }
                this.mstart = new THREE.Vector3();
                this.mstart.copy(mousePoint);
            }
        };
        this.onMouseMove = (e) => {
            let mousePoint = GraphUtil.getMousePosition(e);
            if (mousePoint === null) {
                return;
            }
            if (this.mstart && this.mouseDown) {
                this.mend.copy(mousePoint);
                this.mdelta.subVectors(this.mend, this.mstart);
                this.panViewNoNewData(-this.mdelta.x, -this.mdelta.z);
                this.mstart.copy(this.mend);
            }
        };
        this.onMouseUp = (e) => {
            let mousePoint = GraphUtil.getMousePosition(e);
            if (mousePoint === null) {
                return;
            }
            if (this.mstart) {
                this.mend.copy(mousePoint);
                this.mdelta.subVectors(this.mend, this.mstart);
                this.panView(-this.mdelta.x, -this.mdelta.z);
                this.mstart.copy(this.mend);
            }
            this.mstart = null;
            this.mouseDown = false;
        };
        this.main = () => {
            Graph.renderer.domElement.addEventListener('mousedown', this.onMouseDown, false);
            Graph.renderer.domElement.addEventListener('mousemove', this.onMouseMove, false);
            Graph.renderer.domElement.addEventListener('mouseup', this.onMouseUp, false);
        };
        this.mouseDown = false;
        this.mstart = null;
        this.mend = new THREE.Vector3();
        this.mdelta = new THREE.Vector3();
    }
}
