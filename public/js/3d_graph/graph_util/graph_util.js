    class GraphUtil{
    constructor(){}
    static disposeObject(obj) {
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
    static emptyGroup(g) {
        while (g.children.length > 0) 
        {
            let obj = g.children.pop();
            this.disposeObject(obj);
        }
    };
    static roundTo(number, places) {
        let power = Math.pow(10, places);
        return Math.round(number * power) / power;
    }
    static getRT(scanID){
        return new Promise(function(resolve, reject){
            var xhttpRT = new XMLHttpRequest();
            xhttpRT.onreadystatechange = function () {
            if (this.readyState == 4 && this.status == 200) {
                
                    var rt = parseFloat(this.responseText);
                    console.log(rt)
                    resolve(rt);
                }
            };
            xhttpRT.open("GET", "getRT?projectDir=" + document.getElementById("projectDir").value + "&scanID=" + scanID, true);
            xhttpRT.send();
        })
        
    }

    static findObjectHover(event, objGroup){
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
    static getMousePosition = function(event) {
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
}