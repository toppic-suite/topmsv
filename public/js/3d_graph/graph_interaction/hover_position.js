/*hover_positon.js: display m/z and rt information of the point the mouse cursor is on */
class HoverPosition{
    constructor(){};
    showHighlight = (rt) => {        
        //disdlay a line and a scan information in tooltip
        let markerGroup = Graph.scene.getObjectByName("markerGroup");
        let scanNum = GraphUtil.findNearestScan(rt);

        if (scanNum >= 0) {
            document.getElementById("tooltip-scanID").style.display = "inline-block";
            document.getElementById("tooltip-scanID").style.top = (event.clientY - 20) + 'px';
            document.getElementById("tooltip-scanID").style.left = (event.clientX + 20) + 'px';
            document.getElementById("tooltiptext-scanID").innerHTML = "scan: " + scanNum;
        }
        else{
            document.getElementById("tooltip-scanID").style.display = "none";
        }
    }
    onMouseOver = (event) => {
        let [mz, rt] = GraphUtil.getMzRtCoordinate(event);

        if (mz == "" || rt == ""){
            mz = "";
            rt = "";
        }
        else{
            this.showHighlight(parseFloat(rt));
        }
        document.getElementById("graph-cursor-data").innerText = "m/z: " + mz + "\n" + "retention time: " + rt;
    }
    main = () => {
        Graph.renderer.domElement.addEventListener('mousemove', this.onMouseOver, false);
    }
}