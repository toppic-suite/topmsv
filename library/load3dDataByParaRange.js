const sqlite3 = require('sqlite3').verbose();
/**
 * Get scan of next level one. Async mode.
 * @param {string} dir
 * @param {number} rt
 * @param {function} callback
 * @async
 */
function load3dDataByParaRange(dir, minrt, maxrt, minmz, maxmz, callback) {
    //based on mz rt range, select which table to use
    //assume that in mz range of 10, there are 10 peaks, 
    //assume that in rt range of 0.25, there are 5 scans

    const peakCount = [3000, 18750, 75000, 300000, 768000, 1875000];//max peaks in each table from mzMLReader3D.hpp
    
    let peakPerMz = 1;
    let scanPerRt = 20;
    let expectedPeaks = Math.ceil((maxmz - minmz) * peakPerMz);
    let expectedScans = Math.ceil((maxrt - minrt) * scanPerRt);
    let totalExpectedPeaks = expectedPeaks * expectedScans; 
    let minDiff = Infinity;
    let tableNum = 0;

    for (let i = 0; i < peakCount.length; i++){
        //find which level has the closet number of peaks with totalExpectedPeaks
        let diff = Math.abs(peakCount[i] - totalExpectedPeaks);
        if (diff < minDiff ){
            tableNum = i;
            minDiff = diff;
        } 
    }
    //console.log("total expected peakcount is :" , totalExpectedPeaks);
    console.log("the selected table is PEAKS" , tableNum);

    let sql = `SELECT *
                FROM PEAKS` + tableNum.toString() + 
                ` WHERE RETENTIONTIME <= ? 
                AND RETENTIONTIME >= ?
                AND MZ <= ?
                AND MZ >= ?;`;
    let dbDir = dir;
    let resultDb = new sqlite3.Database(dbDir, (err) => {
        if (err) {
            console.error("error during db generation", err.message);
        }
        // console.log('Connected to the result database.');
    });

    resultDb.all(sql, [maxrt, minrt, maxmz, minmz], (err, row) => {
        if (err) {
            console.error(err.message);
        }
        return callback(null, row);
    });
    resultDb.close();
}
module.exports = load3dDataByParaRange;