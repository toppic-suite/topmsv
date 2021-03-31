/*hover_positon.js: display m/z and rt information of the point the mouse cursor is on */
class HoverPosition{
    constructor(){};
    onMouseOver = (event) => {
        let mousePos = GraphUtil.getMousePosition(event);

        let mz = mousePos.x * Graph.viewRange.mzrange + Graph.viewRange.mzmin;//current mz and rt that has a cursor pointed to
        let rt = mousePos.z * Graph.viewRange.rtrange + Graph.viewRange.rtmin;
        
        if (mz < Graph.viewRange.mzmin){
            mz = "";
        }else if(mz > Graph.viewRange.mzmax){
            mz = "";
        }else{
            mz = mz.toFixed(3);
        }
        if(rt < Graph.viewRange.rtmin){
            rt = "";
        }else if(rt > Graph.viewRange.rtmax){
            rt = "";
        }else{
            rt = (rt/60).toFixed(3);
        }
        if (mz == "" || rt == ""){
            mz = "";
            rt = "";
        }
        document.getElementById("graph-cursor-data").innerText = "m/z: " + mz + "\n" + "retention time: " + rt;
    }
    main = () => {
        Graph.renderer.domElement.addEventListener('mousemove', this.onMouseOver, false);
    }
}