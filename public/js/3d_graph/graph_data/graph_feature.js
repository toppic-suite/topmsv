/*graph_feature.js : draws and manages the peaks on the screen*/
class GraphFeature{
    constructor(){}
    /******** ADD FEAUTRE ANNOTATION ******/
    static updateFeature = (minmz, maxmz, minrt, maxrt) => {
        let featureGroup = Graph.scene.getObjectByName("featureGroup");
        //console.log(minmz, maxmz, minrt, maxrt)
        let data = Graph.currentFeatureData;
        featureGroup.children.forEach(function(featureRect, index) {
            if (index < data.length) {
                let feature = data[index];
                let mz_low = feature.mz_low;
                let mz_high = feature.mz_high;
                let rt_low = feature.rt_low;
                let rt_high = feature.rt_high;

                if (mz_low < minmz){
                    mz_low = minmz;
                    feature.mz_low = minmz;
                }
                if (mz_high > maxmz){
                    mz_high = maxmz;
                    feature.mz_high = maxmz;
                }
                if (rt_low < minrt){
                    rt_low = minrt;
                    feature.rt_low = minrt;
                }
                if (rt_high > maxrt){
                    rt_high = maxrt;
                    feature.rt_high = maxrt;
                }
                rt_high = rt_high;
                rt_low = rt_low;

                featureRect.geometry.attributes.position.array[0] = 0;//vertex at bottom left (0,0)
                featureRect.geometry.attributes.position.array[3] = mz_high - mz_low;
                featureRect.geometry.attributes.position.array[5] = 0;//vertex at bottom right
                featureRect.geometry.attributes.position.array[6] = mz_high - mz_low;
                featureRect.geometry.attributes.position.array[8] = rt_high - rt_low;//vertex at top right
                featureRect.geometry.attributes.position.array[9] = 0;
                featureRect.geometry.attributes.position.array[11] = rt_high - rt_low;//vertex at top left
                featureRect.geometry.attributes.position.array[12] = 0;
                featureRect.geometry.attributes.position.array[14] = 0;//vertex ad bottom left (0,0)
                    
                featureRect.position.set(mz_low, 0, rt_low);

                featureRect.geometry.attributes.position.needsUpdate = true; 
                featureRect.computeLineDistances();
                featureRect.mz_low = feature.mz_low;
                featureRect.mz_high = feature.mz_high;
                featureRect.rt_low = feature.rt_low;
                featureRect.rt_high = feature.rt_high;
                featureRect.featureId = feature.id;

                featureRect.mass = feature.mass;
                featureRect.mono_mz = feature.mono_mz;
                featureRect.charge = feature.charge;
                featureRect.intensity = feature.intensity;
                featureRect.visible = true;

                if (mz_high < Graph.viewRange.mzmin || mz_low > Graph.viewRange.mzmax ||
                    rt_high < Graph.viewRange.rtmin || rt_low > Graph.viewRange.rtmax) {
                    featureRect.visible = false;
                }
            }
            else{
                featureRect.visible = false;
            }
        })
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
                
                xhttp.open("GET","loadMzrtData?projectDir=" + dir + "/" + fileName + ".db" + "&minRT=" + minrt + "&maxRT=" + maxrt + "&minMZ=" + minmz + "&maxMZ=" + maxmz + "&limit=" + 500, true);
               
                xhttp.onload = () => {
                    if (xhttp.readyState == 4 && xhttp.status == 200) {
                        let featureData = JSON.parse(xhttp.responseText);
                        Graph.currentFeatureData = featureData;
                        GraphFeature.updateFeature(minmz, maxmz, minrt, maxrt);            
                        resolve();
                    } 
                }
                xhttp.send();
            }
            else{
                resolve();
            }
        })
    } 
    static drawFeature = (viewRange) => {
        return new Promise((resolve, reject) => {
            let promise = GraphFeature.loadMzrtData(viewRange.mzmin, viewRange.mzmax, viewRange.rtmin, viewRange.rtmax);
            promise.then(() => {
                resolve();
            })
        })
    }
    static drawFeatureNoDataLoad = (viewRange) => {
        return new Promise((resolve, reject) => {
            GraphFeature.updateFeature(viewRange.mzmin, viewRange.mzmax, viewRange.rtmin, viewRange.rtmax);
            resolve();
        })
    }
}