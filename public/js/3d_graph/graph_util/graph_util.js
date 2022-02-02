    /*graph_util.js: class for utility functions used throughout the 3d graph*/
class GraphUtil{
    constructor(){}
    static disposeObject = (obj) => {
        if (obj.material.map) 
        {
            obj.material.map.dispose();
        }
        if (obj.material) 
        {
            obj.material.dispose();
        }
        if (obj.geometry) 
        {
            obj.geometry.dispose();
        }
        if (obj.dispose) 
        {
            obj.dispose();
        }
    };
    static emptyGroup = (g) => {
        while (g.children.length > 0) {
            let obj = g.children.pop();
            this.disposeObject(obj);
        }
    };
    static formatScientificNotation = (intensity) => {
        let sciNumber = intensity.toExponential();
        let decimalPoint = sciNumber.indexOf(".")
        let eNotation = sciNumber.slice(sciNumber.indexOf("e"), sciNumber.length);
        let truncated = sciNumber.slice(0, decimalPoint + 3);

        return truncated.concat(eNotation);
    };
    static updateTextBox = () => {
        //update data range in textboxes if getting range from each scan, not by users
        let centerRT = (Graph.viewRange.rtmax + Graph.viewRange.rtmin)/2;
        let rangeRT = Graph.viewRange.rtmax - centerRT;
        let centerMZ = (Graph.viewRange.mzmax + Graph.viewRange.mzmin)/2;
        let rangeMZ = Graph.viewRange.mzmax - centerMZ;
        document.getElementById('rtRangeMin').value = centerRT.toFixed(3);
        document.getElementById('rtRangeMax').value = rangeRT.toFixed(2);
        document.getElementById('mzRangeMin').value = centerMZ.toFixed(3);
        document.getElementById('mzRangeMax').value = rangeMZ.toFixed(2);
    }
    static roundTo = (number, places) => {
        let power = Math.pow(10, places);
        return Math.round(number * power) / power;
    }
    static sortByRT = (a, b) => {
        const rtA = a.RETENTIONTIME;
        const rtB = b.RETENTIONTIME;
        
        let comparison = 0;
        
        if (rtA > rtB) {
            comparison = 1;
        } else if (rtA < rtB) {
            comparison = -1;
        }
        return comparison;
    }
    /*related to mouse interaction*/
    static findObjectHover = (event, objGroup) => {
        let el = Graph.renderer.domElement;
        let canvasPosition = Graph.renderer.domElement.getBoundingClientRect();
    
        //find mouse position, normalized to a [-1,1] in both x/y-axes on screen
        let coord = {
            x: ((event.clientX  - canvasPosition.left) / el.offsetWidth)  * 2 - 1,
            y: - ((event.clientY  - canvasPosition.top) / el.offsetHeight) * 2 + 1
        };
        let raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(coord, Graph.camera);
    
        let intersects = raycaster.intersectObjects( objGroup.children );
        if (intersects.length > 0){
            return intersects[0].object;
        }
        else{
            return null;
        }
    }
    static getMousePosition = (event) => {
        let el = Graph.renderer.domElement;
        let canvasPosition = Graph.renderer.domElement.getBoundingClientRect();

        //find mouse position, normalized to a [-1,1] in both x/y-axes on screen
        let coord = {
            x: ((event.clientX  - canvasPosition.left) / el.offsetWidth)  * 2 - 1,
            y: - ((event.clientY  - canvasPosition.top) / el.offsetHeight) * 2 + 1
        };
        let raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(coord, Graph.camera);
    
        let pos = new THREE.Vector3( 0, 1, 0 );
        raycaster.ray.intersectPlane(Graph.graphPlane, pos);
        if (pos) {
        //convert world coordinates to graph-fractional coordinates
            pos.multiply(Graph.rangeTransform);
            pos.z = 1 - pos.z;
        }
        return pos;
    }
    static getMzRtCoordinate = (event) => {
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
            rt = rt.toFixed(3);
        }
        return [mz, rt];
    }
    static findNearestRt = (rt) => {
        let rtScanData = rtInteGraph.inteRtArray;
        let threshold = Graph.viewRange.rtrange / 100;
        for (let i = 0; i < rtScanData.length; i++) {
            let diff = Math.abs(rtScanData[i].rt.toFixed(5) - parseFloat(rt).toFixed(5));
            if (diff < threshold) {
                return parseFloat(rtScanData[i].rt);   
            }
        }     
        return -1;   
    }
    static findNearestScan = (rt) => {
        let rtScanData = rtInteGraph.inteRtArray;
        let threshold = Graph.viewRange.rtrange / 100;
        for (let i = 0; i < rtScanData.length; i++) {
            let diff = Math.abs(rtScanData[i].rt.toFixed(5) - parseFloat(rt).toFixed(5));
            if (diff < threshold) {
                return rtScanData[i].scanNum;   
            }
        }     
        return -1;   
    }
    static findIonTime = (rt) => {
        let rtScanData = rtInteGraph.inteRtArray;
        let threshold = Graph.viewRange.rtrange / 100;
        if ('ionTime' in rtScanData[0]) {
            for (let i = 0; i < rtScanData.length; i++) {
                let diff = Math.abs(rtScanData[i].rt.toFixed(5) - parseFloat(rt).toFixed(5));
                if (diff < threshold) {
                    return rtScanData[i].ionTime;   
                }
            }     
            return -1;   
        }
        else{
            return null;
        }
    }

    static getTotalScanCount = async () => {
        let fullDir = Graph.projectDir;

        let res = await fetch('/getTotalScanCount?' + new URLSearchParams({
            projectDir: fullDir
        }));
        let resJSON = await res.json();
        return resJSON.COUNT;
    }
}