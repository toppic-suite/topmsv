/*zoomGraph.js : class defining zoom behavior on the graph
zoom in and zoom out on x and y axis by scrolling mouse wheel 
peak intensity is also adjusted by ctrl + mouse wheel
*/

class GraphZoom
{
    constructor(){}
    
    adjustPeakHeight(scaleFactor){
        let peaks = Graph.scene.getObjectByName("plotGroup");
        let oriScale = peaks.scale.y;

        peaks.scale.set(1, oriScale * scaleFactor, 1);
    
        GraphRender.renderImmediate();
    }
    onZoom(e){
        e.preventDefault();//disable scroll of browser
    
        let axis = GraphUtil.findObjectHover(e, Graph.axisgroup);//axis is null if cursor is not on axis

        if (axis == null){
            if (e.ctrlKey){//if control key is pressed --> intensity zoom
                let scaleFactor = 0;
                if (e.deltaY > 0) {
                    scaleFactor = 0.75;
                    this.adjustPeakHeight(scaleFactor);
                }
                else if (e.deltaY < 0){
                    scaleFactor = 1.5;
                    this.adjustPeakHeight(scaleFactor);
                }
            }
            else{
                this.onZoomFromEventListener(e, "both");
            }
        }
        else{
            if (axis.name == "xAxis"){
                this.onZoomFromEventListener(e, "mz");
            }
            else if(axis.name == "yAxis"){
                this.onZoomFromEventListener(e, "rt");
            }
        }
    }
    onZoomFromEventListener(e, axisName){
        //zoom action detected by event listener in each axis
        let scaleFactor = 0;
        let mousePos = GraphUtil.getMousePosition(e);
    
        let newmzrange = Graph.viewRange.mzrange;
        let newrtrange = Graph.viewRange.rtrange;
    
        let curmz = mousePos.x * Graph.viewRange.mzrange + Graph.viewRange.mzmin;//current mz and rt that has a cursor pointed to
        let currt = mousePos.z * Graph.viewRange.rtrange + Graph.viewRange.rtmin;
    
        //reset view range based on scroll up or down
        if (e.deltaY < 0) {
            scaleFactor = 0.8;
        }
        else{
            scaleFactor = 1.2;
        }
        //figure out where the cursor is (near x axis, y axis)
        if (axisName == "rt"){
            newrtrange = Graph.viewRange.rtrange * scaleFactor;
        }
        else if (axisName == "mz"){//mz range adjust
            newmzrange = Graph.viewRange.mzrange * scaleFactor;
        }
        else if (axisName == "both"){//if adjusting both
            newrtrange = Graph.viewRange.rtrange * scaleFactor;
            newmzrange = Graph.viewRange.mzrange * scaleFactor;
        }
        else{
            return;
        }
    
        //if range is too small, set to minimum range of 0.01
        if (newrtrange < 0.01){
            newrtrange = 0.01;
        }
        if (newmzrange < 0.01){
            newmzrange = 0.01;
        }
        let mzscale = (curmz - Graph.viewRange.mzmin)/(Graph.viewRange.mzmax - Graph.viewRange.mzmin);//find relative pos of current mz currrent rt
        let rtscale = (currt - Graph.viewRange.rtmin)/(Graph.viewRange.rtmax - Graph.viewRange.rtmin);
    
        let newmzmin = curmz - (mzscale * newmzrange);//the closer curmz or currt is to the minmz and minrt, the less change in min value
        let newrtmin = currt - (rtscale * newrtrange);
    
        //if value goes below zero in rt or mz, set to 0
        if (newmzmin < 0){
            newmzmin = 0;
        }
        if (newrtmin < 0){
            newrtmin = 0;
        }
        //if max value is going to go over the max mz, rt, set them to be the max value, no going over the limit
        if (newmzmin + newmzrange > Graph.dataRange.mzmax){
            newmzrange = Graph.dataRange.mzmax - newmzmin;
        }
        if (newrtmin + newrtrange > Graph.dataRange.rtmax){
            newrtrange = Graph.dataRange.rtmax - newrtmin;
        }
        let graphData = new GraphData();
        graphData.drawGraph(newmzmin, newmzmin + newmzrange, newrtmin, newrtmin + newrtrange, rawRT);
    }
    init(){
        Graph.renderer.domElement.addEventListener('wheel', this.onZoom.bind(this), false);
    }
}
