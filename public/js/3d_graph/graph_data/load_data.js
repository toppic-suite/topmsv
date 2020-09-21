/*load_data.js: calculate which table to use, query database for data, and return result*/

class LoadData{
    constructor(){}
    static calculateTableNum = () => {
        /*decide which table to query based on what is the ratio is between current range and whole graph
        if the ratio is small (1:100), the detail level is high, and the peaks in that range are more*/
        let tableNum = -1;
      
        let totalMzRange = Graph.tablePeakCount[0].MZMAX- Graph.tablePeakCount[0].MZMIN; 
        let totalRtRange = Graph.tablePeakCount[0].RTMAX - Graph.tablePeakCount[0].RTMIN;
    
        let xRatio = (Graph.viewRange.mzmax - Graph.viewRange.mzmin) / totalMzRange;
        let yRatio = (Graph.viewRange.rtmax - Graph.viewRange.rtmin) / totalRtRange;
        
        let peakCnt = 3000 / (xRatio * yRatio);

        let diff = Number.MAX_VALUE;
        
        //find which table has the closet number of peaks
        for (let i = 0; i < Graph.tablePeakCount.length; i++){
            
            if (Math.abs(Graph.tablePeakCount[i].COUNT - peakCnt) < diff){
                diff = Math.abs(Graph.tablePeakCount[i].COUNT - peakCnt);
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
    static getConfigData = () => {
        return new Promise(function(resolve, reject){
            console.log("projectDir", Graph.projectDir)
            let fullDir = Graph.projectDir.split("/");
            let fileName = (fullDir[fullDir.length -1].split("."))[0];
            let dir = fullDir[0].concat("/");
            dir = dir.concat(fullDir[1]);
    
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
            xhttp3.open("GET","getMax?projectDir=" + dir + "/" + fileName + ".db" + "&colName=" + 'MZ',true);
            xhttp3.send();
        });
    }
    static load3dData = (curViewRange) => {
        /*load data from database based on current graph range*/
        return new Promise((resolve, reject) => {
            let xhttp = new XMLHttpRequest();
            let tableNum = LoadData.calculateTableNum();
            let fullDir = Graph.projectDir.split("/");
            let fileName = (fullDir[fullDir.length -1].split("."))[0];
            let dir = fullDir[0].concat("/");
            dir = dir.concat(fullDir[1]);
            xhttp.open("GET","load3dDataByParaRange?projectDir=" + dir + "/" + fileName + ".db" + "&tableNum=" + tableNum + "&minRT=" + curViewRange.rtmin + "&maxRT=" + curViewRange.rtmax + "&minMZ=" + curViewRange.mzmin + "&maxMZ=" + curViewRange.mzmax + "&maxPeaks=" + Graph.maxPeaks, true);

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