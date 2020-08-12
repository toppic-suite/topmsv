//on hover, highlught and display feature information (scan ID, intensity, rt, mz)

MsGraph.prototype.hoverGraph = function(graph){
   this.currentFeature = null;
   graph.renderer.domElement.addEventListener('mousemove', this.onMouseOver.bind(this), false);
}
MsGraph.prototype.findObjectHover = function(event){
    var el = this.renderer.domElement;
    let canvasPosition = this.renderer.domElement.getBoundingClientRect();

    //find mouse position, normalized to a [-1,1] in both x/y-axes on screen
    var coord = {
        x: ((event.clientX  - canvasPosition.left) / el.offsetWidth)  * 2 - 1,
        y: - ((event.clientY  - canvasPosition.top) / el.offsetHeight) * 2 + 1
    };
    var raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(coord, this.resizedCamera);

    var intersects = raycaster.intersectObjects( this.scene.getObjectByName("featureGroup").children );
    if (intersects.length > 0){
        return intersects[0].object;
    }
    else{
        return null;
    }
}
MsGraph.prototype.onMouseOver = function(event){
    //let mousePos = this.getMousePosition(event);
    let obj = this.findObjectHover(event);
    if (obj != null){
        document.getElementById("tooltip").style.display = "inline-block";
        document.getElementById("tooltip").style.top = (event.clientY - 10) + 'px';
        document.getElementById("tooltip").style.left = (event.clientX + 20) + 'px';
        //document.getElementById("tooltiptext").innerHTML = "mass: " + obj.mass + "<br/>" + "mono_mz: " + obj.mono_mz + 
        //"<br/>" + "charge: " + obj.charge + "<br/>" + "intensity: " + obj.intensity;
        document.getElementById("tooltiptext").innerHTML = "mz_low: " + obj.mz_low + "<br/>" + "mz_high: " + obj.mz_high + 
        "<br/>" + "rt_low: " + obj.rt_low + "<br/>" + "rt_high: " + obj.rt_high;
    }
    else{
        document.getElementById("tooltip").style.display = "none";
    }
    

    /*
    if (this.currentFeature != null){//restore orig color for the peak that was highlighted previously
        this.currentPeak.material.color.setHex( this.currentPeak.origColor);
        this.currentPeak.pinhead.material.color.setHex(this.currentPeak.origColor);
    }*/

}
