/*hover_positon.js: display m/z and rt information of the point the mouse cursor is on */
class HoverPosition{
    constructor(){};
    showHighlight = (mz, rt) => {      
        //disdlay a line and a scan information in tooltip
        let scanNum = GraphUtil.findNearestScan(parseFloat(rt));
        let sep = "</br>";
        if (scanNum >= 0) {
            document.getElementById("tooltip-scanID").style.display = "inline-block";
            document.getElementById("tooltip-scanID").style.top = (event.clientY - 70) + 'px';
            document.getElementById("tooltip-scanID").style.left = (event.clientX + 20) + 'px';
            document.getElementById("tooltiptext-scanID").innerHTML = "scan: " + scanNum + sep + "mz: " + GraphUtil.formatFloat(mz) + sep + "rt: " + GraphUtil.formatFloat(rt) + sep;
            
        }
        else{
            document.getElementById("tooltip-scanID").style.display = "none";
        }
    }
    onMouseOver = (event) => {
        let [mz, rt] = GraphUtil.getMzRtCoordinate(event);
        let scan =  GraphUtil.findNearestScan(rt);
        let cursorData = "";

        if (mz == "" || rt == ""){
            mz = "";
            rt = "";
        }
        else{
            if (event.ctrlKey) {
                this.showHighlight(mz, rt);
            }
            else{
                document.getElementById("tooltip-scanID").style.display = "none";
            }
        }
        if (scan < 0) {
            scan = "n/a";
        }
        
        let ionTime = GraphUtil.findIonTime(rt);
        if (ionTime != null) {
            ionTime = ionTime.toFixed(3);
            if (ionTime < 0) {
                ionTime = "n/a";
            }
            cursorData = "m/z: " + GraphUtil.formatFloat(mz) + "\n" + "retention time (min): " + GraphUtil.formatFloat(rt) + "\n" + "ion injection time (ms): " + GraphUtil.formatFloat(ionTime) + "\n" + "scan ID: " + scan;
        }
        else{
            cursorData = "m/z: " + GraphUtil.formatFloat(mz) + "\n" + "retention time (min): " + GraphUtil.formatFloat(rt) + "\n" + "scan ID: " + scan;
        }
        document.getElementById("graph-cursor-data").innerText = cursorData;
    }
    main = () => {
        Graph.renderer.domElement.addEventListener('mousemove', this.onMouseOver, false);
    }
}