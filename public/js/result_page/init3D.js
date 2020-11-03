function getMs2Scan(projectDir, scanID){
    return new Promise(function(resolve, reject){
        let xhttp = new XMLHttpRequest();
        let fullDir = projectDir;
        let dotIndex = fullDir.lastIndexOf(".");
        let dir = (fullDir.substr(0, dotIndex)).concat(".db");
        xhttp.open("GET","relatedScan2?projectDir=" + dir + "&scanID=" + scanID.toString(), true);

        xhttp.onload = () => {
            if (xhttp.status == 200 && xhttp.readyState == 4) {
                let ms2Scan = JSON.parse(xhttp.response);
                resolve(ms2Scan);
            }     
        }
        xhttp.send();
    })
}
function getMs1Scan(projectDir, scanID){
    return new Promise(function(resolve, reject){
        let xhttp = new XMLHttpRequest();
        let fullDir = projectDir;
        let dotIndex = fullDir.lastIndexOf(".");
        let dir = (fullDir.substr(0, dotIndex)).concat(".db");
        xhttp.open("GET","relatedScan1?projectDir=" + dir + "&scanID=" + scanID.toString(), true);

        xhttp.onload = () => {
            if (xhttp.status == 200 && xhttp.readyState == 4) {
                let ms1Scan = JSON.parse(xhttp.response);
                resolve(ms1Scan);
            }     
        }
        xhttp.send();
    })
}
function checkRelatedScan(projectDir, scanID){
    /*input: projectDir = project directory, scanID = number the user provided in the textBox
    output: a related ms2 scan for given scanID.*/
    /*it first checks if it has related ms2 scan by calling getMs2Scan. 
    *If result >=0 , related ms2 scan is found, so the result is the return value.
    *if the result is -1, it means scanID is either a ms1Scan without related scan or ms2scan.
    *in that case, check if it has related ms1 scan by calling getMs1Scan.
    *if the result is -1, it means scanID does not have related scan, so return -1.
    *else, it means scanID was a ms2 scan. Return scanID as the return value. */
    return new Promise(function(resolve, reject){
        let promise = getMs2Scan(projectDir, scanID);
        promise.then((ms2Scan)=>{
            if (ms2Scan >= 0){
                resolve(ms2Scan);
            }else{
                let promise = getMs1Scan(projectDir, scanID);
                promise.then((ms1Scan) => {
                    if(ms1Scan >= 0){
                        resolve(scanID);
                    }else{
                        resolve(-1);
                    }
                })
            }
        })
    })
}
function getPrecursorMz(projectDir, ms2Scan){
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
    let promise = checkRelatedScan(projectDir, scanID);
    let promise2 = LoadData.getRT(scanID);

    let promiseMZ = promise.then((ms2Scan) => {
        return getPrecursorMz(projectDir, ms2Scan);
    }).then((precMz)=>{
        return calcInitRange(precMz);
    }).catch((err) => {
        console.log(err);
    })
    
    let promiseRT = promise2.then((curRT)=>{
        return curRT;
    }).catch((err) => {
        console.log(err);
    })
    Promise.all([promiseMZ, promiseRT]).then((values)=>{
        let mzRange = values[0];
        let curRT = values[1];
        GraphData.updateGraph(curRT, mzRange.mzmin, mzRange.mzmax);
    })
}
function init3D(scanID){
    let projectDir = document.getElementById("projectDir").value;
    let dir = projectDir.substr(0, projectDir.lastIndexOf(".")) + ".db";
    let graph = new Graph(dir);

    let promise = getMs2Scan(projectDir, scanID);

    promise.then((ms2Scan) => {
        let scan = ms2Scan;
        if (ms2Scan < 0){
            let promise = getMs1Scan(projectDir, scanID);
            promise.then((ms1Scan) => {
                scan = ms1Scan;
                return getPrecursorMz(projectDir,scan);
            })
        }else{
            return getPrecursorMz(projectDir,ms2Scan);
        }
    }).then((precMz)=>{
        let mzRange = calcInitRange(precMz);
        graph.main(mzRange.mzmin, mzRange.mzmax, scanID);
    }).catch((err) => {
        console.log(err);
    })
}