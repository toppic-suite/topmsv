class LoadData{
    constructor(){}
    static calculateTableNum(){
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
    static load3dDataByParaRange(curViewRange){
        //same as load3dDataByParaRange, but this functions runs only when a scan changes
        //to load all peaks of ms1 graph so that ms1 graph peaks are always showing in 3d graph
        //when a range changes in the same scan, call load3dDataByParaRange instead
        let self = this;

        return new Promise(function(resolve, reject){
            let xhttp = new XMLHttpRequest();
            let tableNum = self.calculateTableNum();
            let fullDir = (document.getElementById("projectDir").value).split("/");
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