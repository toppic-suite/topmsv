/*function getMs2Scan(projectDir, scanID, dataGetter){
    let res = await dataGetter.getRelatedScan2(scanID);

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
    /*return new Promise(function(resolve, reject){
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
function checkRelatedScan(projectDir: string, scanID: number): Promise<number> {
  return new Promise(function(resolve, reject) {
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
    /*return new Promise(function(resolve, reject){
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
}*/
export function calcInitRange(precMz: string){
  let mzRange = {} as {"mzmin": number, "mzmax": number};
  let specPara: SpectrumViewParameters = new SpectrumViewParameters();
  if (parseFloat(precMz) > 0){//if has ms2 scan, calculate m/z range}
    specPara.updateMzRange(parseFloat(precMz));
    mzRange["mzmin"] = specPara.getWinMinMz();
    mzRange["mzmax"] = specPara.getWinMaxMz();
  } else {
    mzRange["mzmin"] = specPara.getWinMinMz();
    mzRange["mzmax"] = specPara.getWinMaxMz();
  }
  return mzRange;
}
