/*hover_feature.js: on hover, highlught and display feature information (scan ID, intensity, rt, mz)*/
class HoverFeature{
    constructor(){};
    onMouseOver = (event) => {
        if (event.ctrlKey) {
            let objGroup = Graph.scene.getObjectByName("featureGroup");
            let obj = GraphUtil.findFeatureOnHover(event, objGroup);
            if (obj != null){
                let intensity = 0;
                if (obj.intensity > 0){
                    intensity = GraphUtil.formatScientificNotation(obj.intensity);
                }
                document.getElementById("tooltip").style.display = "inline-block";
                document.getElementById("tooltip").style.top = (event.clientY - 10) + 'px';
                document.getElementById("tooltip").style.left = (event.clientX + 20) + 'px';
                document.getElementById("tooltiptext").innerHTML = "feature ID: " + obj.featureId + "<br/>" + "mass: " + obj.mass + "<br/>" + "mono_mz: " + obj.mono_mz + 
                "<br/>" + "charge: " + obj.charge + "<br/>" + "intensity: " + intensity;
            }
            else{
                document.getElementById("tooltip").style.display = "none";
            }
        }
        else{
            document.getElementById("tooltip").style.display = "none";
        }
    }
    main = () => {
        Graph.renderer.domElement.addEventListener('mousemove', this.onMouseOver, false);
    }
}
