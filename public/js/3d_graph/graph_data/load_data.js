/*load_data.js: calculate which table to use, query database for data, and return result*/

class LoadData{
    constructor(){}
    static calculateTableNum = () => {
        /*decide which table to query based on what is the ratio is between current range and whole graph
        if the ratio is small (1:100), the detail level is high, and the peaks in that range are more*/
        let tableNum = -1;
      
        let totalMzRange = Graph.configData[0].MZMAX- Graph.configData[0].MZMIN; 
        let totalRtRange = Graph.configData[0].RTMAX - Graph.configData[0].RTMIN;
    
        let xRatio = (Graph.viewRange.mzmax - Graph.viewRange.mzmin) / totalMzRange;
        let yRatio = (Graph.viewRange.rtmax - Graph.viewRange.rtmin) / totalRtRange;
        
        let peakCnt = 3000 / (xRatio * yRatio);

        let diff = Number.MAX_VALUE;
        
        //find which table has the closet number of peaks
        for (let i = 0; i < Graph.configData.length; i++){
            
            if (Math.abs(Graph.configData[i].COUNT - peakCnt) < diff){
                diff = Math.abs(Graph.configData[i].COUNT - peakCnt);
                tableNum = i;
            }
        }
        if (tableNum < 0){
            console.log("something wrong during calculateTableNum")
            return;
        }
        console.log("current table number : ", tableNum);
        return tableNum;
    }
    static getRT = (scanNum) => {
        return new Promise(function(resolve, reject){
            let fullDir = Graph.projectDir;
            let dotIndex = fullDir.lastIndexOf(".");
            let dir = (fullDir.substr(0, dotIndex)).concat(".db");

            let xhttpRT = new XMLHttpRequest();
            xhttpRT.onreadystatechange = function () {
                if (this.readyState == 4 && this.status == 200) {
                    var rt = parseFloat(this.responseText);
                    
                    if (rt != undefined){
                        resolve(rt);
                    }
                }
            };
            xhttpRT.open("GET", "getRT?projectDir=" + dir + "&scanID=" + scanNum, true);
            xhttpRT.send();
        })
    }
    static getConfigData = () => {
        return new Promise(function(resolve, reject){
            let fullDir = Graph.projectDir;
            let dotIndex = fullDir.lastIndexOf(".");
            let dir = (fullDir.substr(0, dotIndex)).concat(".db");
    
            var xhttp3 = new XMLHttpRequest();
            xhttp3.onreadystatechange = function (){
                if (this.readyState == 4 && this.status == 200) {
                    var result = JSON.parse(this.responseText);
    
                    if (result != undefined){
                        resolve(result);
                    }
                    else{
                        reject("max values are undefined")
                    }
                }
            }
            xhttp3.open("GET","getMax?projectDir=" + dir + "&colName=" + 'MZ',true);
            xhttp3.send();
        });
    }
    static load3dData = (curViewRange) => {
        /*load data from database based on current graph range*/
        return new Promise((resolve, reject) => {
            let xhttp = new XMLHttpRequest();
            let tableNum = LoadData.calculateTableNum();
            let fullDir = Graph.projectDir;
            let dotIndex = fullDir.lastIndexOf(".");
            let dir = (fullDir.substr(0, dotIndex)).concat(".db");
 
            xhttp.open("GET","load3dDataByParaRange?projectDir=" + dir + "&tableNum=" + tableNum + "&minRT=" + curViewRange.rtmin + "&maxRT=" + curViewRange.rtmax + "&minMZ=" + curViewRange.mzmin + "&maxMZ=" + curViewRange.mzmax + "&maxPeaks=" + Graph.maxPeaks, true);

            xhttp.onload = () => {
                if (xhttp.status == 200 && xhttp.readyState == 4) {
                    let peakData = JSON.parse(xhttp.response);
                    resolve(peakData);
                }     
            }
            xhttp.send();
        });
    }
}