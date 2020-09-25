function getMs2Scan(projectDir, scanID){
    return new Promise(function(resolve, reject){
        let xhttp = new XMLHttpRequest();
        let fullDir = projectDir;
        let dotIndex = fullDir.lastIndexOf(".");
        let dir = (fullDir.substr(0, dotIndex)).concat(".db");
        xhttp.open("GET","relatedScan1?projectDir=" + dir + "&scanID=" + scanID.toString(), true);

        xhttp.onload = () => {
            if (xhttp.status == 200 && xhttp.readyState == 4) {
                let ms2Scan = JSON.parse(xhttp.response);
                resolve(ms2Scan);
            }     
        }
        xhttp.send();
    })
}
function getPrecursorMz(ms2Scan, projectDir){
    return new Promise(function(resolve, reject){
        let xhttp = new XMLHttpRequest();
        let fullDir = projectDir;
        let dotIndex = fullDir.lastIndexOf(".");
        let dir = (fullDir.substr(0, dotIndex)).concat(".db");
        xhttp.open("GET","precMZ?projectDir=" + dir + "&scanID=" + ms2Scan, true);

        xhttp.onload = () => {
            if (xhttp.status == 200 && xhttp.readyState == 4) {
                let precMz = JSON.parse(xhttp.response);
                resolve(precMz);
            }     
        }
        xhttp.send();
    })
}
function calcInitRange(precMz){
    let mzRange = {};
    let specPara = new SpectrumParameters();
    if (parseFloat(precMz) > 0){//if has ms2 scan, calculate m/z range}
        specPara.updateMzRange(precMz);
        mzRange["mzmin"] = specPara.winMinMz;
        mzRange["mzmax"] = specPara.winMaxMz;
    }
    else{
        specPara.initParameters(peakList1_g);
        mzRange["mzmin"] = specPara.winMinMz;
        mzRange["mzmax"] = specPara.winMaxMz;
    }
    return mzRange;
}
function update3D(scanID){
    let projectDir = document.getElementById("projectDir").value;
    let promise = getMs2Scan(projectDir, scanID);
    
    promise.then((ms2Scan) => {
        return getPrecursorMz(ms2Scan, projectDir);
    }).then((precMz)=>{
        let mzRange = calcInitRange(precMz);
        GraphData.drawInitGraph(mzRange.mzmin, mzRange.mzmax, scanID);
    }).catch((err) => {
        console.log(err);
    })
}
function init3D(scanID){
    let projectDir = document.getElementById("projectDir").value;
    let dir = projectDir.substr(0, projectDir.lastIndexOf(".")) + ".db";
    let graph = new Graph(dir);

    let promise = getMs2Scan(projectDir, scanID);

    promise.then((ms2Scan) => {
        return getPrecursorMz(ms2Scan, projectDir);
    }).then((precMz)=>{
        let mzRange = calcInitRange(precMz);
        graph.main(mzRange.mzmin, mzRange.mzmax, scanID);
    }).catch((err) => {
        console.log(err);
    })
}