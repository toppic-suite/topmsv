/*graph_feature.js : draws and manages the peaks on the screen*/
class GraphFeature{
    constructor(){}
    /******** ADD FEAUTRE ANNOTATION ******/
    static updateFeature = (data, minmz, maxmz, minrt, maxrt) => {
        let featureGroup = Graph.scene.getObjectByName("featureGroup");
        console.log("features in this area", data.length);
        featureGroup.children.forEach(function(featureRect, index) {
            if (index < data.length) {
                let feature = data[index];
                let mz_low = feature.mz_low;
                let mz_high = feature.mz_high;
                let rt_low = feature.rt_low;
                let rt_high = feature.rt_high;
                let points = [];

                if (mz_low < minmz){
                    mz_low = minmz;
                }
                if (mz_high > maxmz){
                    mz_high = maxmz;
                }
                if (rt_low < minrt){
                    rt_low = minrt;
                }
                if (rt_high > maxrt){
                    rt_high = maxrt;
                }
                rt_high = rt_high * 60;
                rt_low = rt_low * 60;
                //console.log(mz_low, mz_high, rt_low/60, rt_high/60)
                //adjust point position when it goes outside of the graph range
                points.push( new THREE.Vector3(mz_low, 0.1, rt_high) );
                points.push( new THREE.Vector3(mz_high, 0.1, rt_high) );
                points.push( new THREE.Vector3(mz_high, 0.1, rt_low) );
                points.push( new THREE.Vector3(mz_low, 0.1, rt_low) );
                points.push( new THREE.Vector3(mz_low, 0.1, rt_high) );

                featureRect.geometry.setFromPoints( points );
                featureRect.geometry.attributes.position.needsUpdate = true; 
                featureRect.computeLineDistances();
                featureRect.mz_low = feature.mz_low;
                featureRect.mz_high = feature.mz_high;
                featureRect.rt_low = feature.rt_low;
                featureRect.rt_high = feature.rt_high;
        
                featureRect.mass = feature.mass;
                featureRect.mono_mz = feature.mono_mz;
                featureRect.charge = feature.charge;
                featureRect.intensity = feature.intensity;
                featureRect.visible = true;

            }
            else{
                featureRect.visible = false;
            }
        })
        let mz_squish = Graph.gridRange / Graph.viewRange.mzrange;
        let rt_squish = - Graph.gridRange / Graph.viewRange.rtrange;

        featureGroup.scale.set(mz_squish, 1, rt_squish);
        // Reposition the plot so that mzmin,rtmin is at the correct corner
        featureGroup.position.set(-Graph.viewRange.mzmin*mz_squish, 0, Graph.gridRange - Graph.viewRange.rtmin*rt_squish);
        //GraphRender.renderImmediate();
    }
    static addFeatureToGraph = (featureData, minmz, maxmz, minrt, maxrt) => {
        //draw rectangle (4 separate lines) from each feature Data
        let featureGroup = Graph.scene.getObjectByName("featureGroup");
        for (let i = 0; i < featureData.length; i++){
            let data = featureData[i];
            let linemat = new THREE.LineDashedMaterial( { color: Graph.featureColor, dashSize: 0.01, gapSize: 0.005 } )
            let points = [];
    
            let mz_low = data.mz_low;
            let mz_high = data.mz_high;
            let rt_low = data.rt_low;
            let rt_high = data.rt_high;
    
            if (mz_low < minmz){
                mz_low = minmz;
            }
            if (mz_high > maxmz){
                mz_high = maxmz;
            }
            if (rt_low < minrt){
                rt_low = minrt;
            }
            if (rt_high > maxrt){
                rt_high = maxrt;
            }
    
            rt_high = rt_high * 60;
            rt_low = rt_low * 60;
    
            //adjust point position when it goes outside of the graph range
            points.push( new THREE.Vector3(mz_low, 0.1, rt_high) );
            points.push( new THREE.Vector3(mz_high, 0.1, rt_high) );
            points.push( new THREE.Vector3(mz_high, 0.1, rt_low) );
            points.push( new THREE.Vector3(mz_low, 0.1, rt_low) );
            points.push( new THREE.Vector3(mz_low, 0.1, rt_high) );
    
            let geometry = new THREE.BufferGeometry().setFromPoints( points );
    
            let feature = new THREE.Line( geometry, linemat );
            feature.computeLineDistances();
    
            feature.mz_low = data.mz_low;
            feature.mz_high = data.mz_high;
            feature.rt_low = data.rt_low;
            feature.rt_high = data.rt_high;
    
            feature.mass = data.mass;
            feature.mono_mz = data.mono_mz;
            feature.charge = data.charge;
            feature.intensity = data.intensity;
    
            feature.name = "featureAnnotation";
            //console.log(feature)
            featureGroup.add(feature);
        }
        let mz_squish = Graph.gridRange / Graph.viewRange.mzrange;
        let rt_squish = - Graph.gridRange / Graph.viewRange.rtrange;

        featureGroup.scale.set(mz_squish, 1, rt_squish);
        // Reposition the plot so that mzmin,rtmin is at the correct corner
        featureGroup.position.set(-Graph.viewRange.mzmin*mz_squish, 0, Graph.gridRange - Graph.viewRange.rtmin*rt_squish);
    }
    static loadMzrtData = (minmz, maxmz, minrt, maxrt) => {
        return new Promise((resolve, reject) => {
            if($('#featureStatus').val() != "0"){
                //load feature data in this range
                let fullDir = (document.getElementById("projectDir").value).split("/");
                let fileName = (fullDir[fullDir.length -1].split("."))[0];
                let dir = fullDir[0].concat("/");
                dir = dir.concat(fullDir[1]);
                
                let xhttp = new XMLHttpRequest();
                xhttp.open("GET","loadMzrtData?projectDir=" + dir + "/" + fileName + ".db" + "&minRT=" + minrt + "&maxRT=" + maxrt + "&minMZ=" + minmz + "&maxMZ=" + maxmz, true);
                xhttp.onload = () => {
                    if (xhttp.readyState == 4 && xhttp.status == 200) {
                        let featureData = JSON.parse(xhttp.responseText);
                        ///GraphFeature.addFeatureToGraph(featureData, minmz, maxmz, minrt, maxrt);            
                        GraphFeature.updateFeature(featureData, minmz, maxmz, minrt, maxrt);            
                        resolve();
                    } 
                }
                xhttp.send();
            }
        })
    } 
    static drawFeature = (viewRange) => {
        return new Promise((resolve, reject) => {
            let promise = GraphFeature.loadMzrtData(viewRange.mzmin, viewRange.mzmax, viewRange.rtmin/60, viewRange.rtmax/60);
            promise.then(() => {
                resolve();
            })
        })
    }
}