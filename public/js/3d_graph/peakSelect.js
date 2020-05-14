// peakSelect.js : Select a peak with the highest intensity for each grid block and copy the row to the corresponding table

/* iterate through the input data and get intensity
* compare with the existing value in gridBlocks with same index (mz, rt)
* if it is higher, copy to a table
* try first with 1000 rows, one table
*/
function PeakSelect(rawPoints){
    this.rawPoints = rawPoints;
    this.gridBlocks = Array(100).fill().map(() => Array(30).fill([]));
}
PeakSelect.prototype.assignPeaks = function(){
    console.log("dataRange", this.dataRange);
    //the index is determined mzrange / grid width, rtrange/ grid height
    //for now, the grid is 100 * 30 (original grid ratio is 10:3)
    let mzScale = 100 / this.dataRange.mzrange;
    let rtScale = 30 / this.dataRange.rtrange;

    //for each peak
    for (let i = 0; i < this.rawPoints.length; i++){
        let mz = Math.ceil(this.rawPoints[i].MZ * mzScale);
        let rt = Math.ceil(this.rawPoints[i].RETENTIONTIME * rtScale);

        if (this.gridBlocks[mz][rt].length < 1){
            //no peak has been identified. store intensity of this peak;
            this.gridBlocks[mz][rt] = this.rawPoints[i];
        }
        else{
            if (this.gridBlocks[mz][rt].INTENSITY < this.rawPoints[i].INTENSITY){
                this.gridBlocks[mz][rt] = this.rawPoints[i];
            }
        }
    }
    return this.gridBlocks;
}
PeakSelect.prototype.getDataRange = function(filePath){
    //data range is parsed from dataRange.txt
    let readFile = new XMLHttpRequest();
    
    readFile.open("GET", file, false);
    readFile.onreadystatechange = function (){
        if (readFile.readyState === 4){
            if (rawFile.status === 200 || rawFile.status == 0){
                let rawData = readFile.responseText;
                rawData = rawData.split("\t");

                let dataRange =  {mzmin: 0, mzmax: 1, mzrange: 1, rtmin: 0, rtmax: 1, rtrange: 1, intmin: 0, intmax: 1000};
                dataRange.mzmin = parseFloat(rawData[0]);
                dataRange.mzmax = parseFloat(rawData[1]);
                dataRange.mzrange = dataRange.mzmax - dataRange.mzmin;

                dataRange.rtmin = parseFloat(rawData[2]);
                dataRange.rtmax = parseFloat(rawData[3]);
                dataRange.rtrange = dataRange.rtmax - rtmin;
                
                this.dataRange = dataRange;
            
            }
        }
    }
    readFile.send();
}