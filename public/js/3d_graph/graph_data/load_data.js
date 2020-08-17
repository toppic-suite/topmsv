class LoadData{
    constructor(){}
    static calculateTableNum(minrt, maxrt, minmz, maxmz){
        /*decide which table to query based on what is the ratio is between current range and whole graph
        if the ratio is small (1:100), the detail level is high, and the peaks in that range are more*/
    
        let tableNum = -1;
      
        let totalMzRange = Graph.tablePeakCount[0].MZMAX- Graph.tablePeakCount[0].MZMIN; 
        let totalRtRange = Graph.tablePeakCount[0].RTMAX - Graph.tablePeakCount[0].RTMIN;
    
        let xRatio = (maxmz - minmz) / totalMzRange;
        let yRatio = (maxrt - minrt) / totalRtRange;
        
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
    static load3dDataByParaRange(minmz, maxmz, minrt, maxrt, curRT, updateTextBox){
        //same as load3dDataByParaRange, but this functions runs only when a scan changes
        //to load all peaks of ms1 graph so that ms1 graph peaks are always showing in 3d graph
        //when a range changes in the same scan, call load3dDataByParaRange instead
        let self = this;

        return new Promise(function(resolve, reject){
            let tableNum = self.calculateTableNum(minrt, maxrt, minmz, maxmz);
            var xhttp = new XMLHttpRequest();
            
            let fullDir = (document.getElementById("projectDir").value).split("/");
            let fileName = (fullDir[fullDir.length -1].split("."))[0];
            let dir = fullDir[0].concat("/");
            dir = dir.concat(fullDir[1]);

            xhttp.onreadystatechange = function (){
                if (this.readyState == 4 && this.status == 200) {
                    var peakData = JSON.parse(this.responseText);
                    let t0 = new Date();    
                    console.log("loadingScanData: ", new Date() - t0);
                    if (updateTextBox){
                        //update data range in textboxes if getting range from each scan, not by users
                        document.getElementById('rtRangeMin').value = (minrt/60).toFixed(4);
                        document.getElementById('rtRangeMax').value = (maxrt/60).toFixed(4);
                        document.getElementById('mzRangeMin').value = parseFloat(minmz).toFixed(4);
                        document.getElementById('mzRangeMax').value = parseFloat(maxmz).toFixed(4);
                    }
                    resolve(peakData);
                }
            }
            xhttp.open("GET","load3dDataByParaRange?projectDir=" + dir + "/" + fileName + ".db" + "&tableNum=" + tableNum + "&minRT=" + minrt + "&maxRT=" + maxrt + "&minMZ=" + minmz + "&maxMZ=" + maxmz + "&curRT=" + curRT, true);
            xhttp.send();
        });
    }
}