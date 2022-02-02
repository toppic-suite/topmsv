/*hover_feature.js: on hover, highlught and display feature information (scan ID, intensity, rt, mz)*/
class HoverFeature{
    constructor(){};
    static findFeatureOnHover = (event, objGroup) => {
        let [mz, rt] = GraphUtil.getMzRtCoordinate(event);
        mz = parseFloat(mz);
        rt = parseFloat(rt);
   
        let mzThreshold = Graph.viewRange.mzrange / 60;
        let rtThreshold = Graph.viewRange.rtrange / 60;
        
        for (let i = 0; i < objGroup.children.length; i++) {
            let feature = objGroup.children[i];
            if (feature.visible) {
                //if close to one of the edges of the feature annotation rect
                if ( (Math.abs(mz - feature.mz_low) <= mzThreshold && rt >= feature.rt_low && rt <= feature.rt_high) || 
                     (Math.abs(mz - feature.mz_high) <= mzThreshold && rt >= feature.rt_low && rt <= feature.rt_high) || 
                     (Math.abs(rt - feature.rt_low) <= rtThreshold && mz >= feature.mz_low && mz <= feature.mz_high) ||
                     (Math.abs(rt - feature.rt_high) <= rtThreshold && mz >= feature.mz_low && mz <= feature.mz_high)
                   ) 
                {
                    return feature;
                }
            }
        }
        return null;
    }
    onMouseOver = (event) => {
        if (event.ctrlKey) {
            let objGroup = Graph.scene.getObjectByName("featureGroup");
            let obj = HoverFeature.findFeatureOnHover(event, objGroup);
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
