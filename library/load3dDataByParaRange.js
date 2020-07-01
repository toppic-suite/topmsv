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

    const peakCount = [3000, 18750, 75000, 468750, 1875000];//max peaks in each table from mzMLReader3D.hpp
    
    let peakPerMz = 1;
    let scanPerRt = 20;
    let expectedPeaks = Math.ceil((maxmz - minmz) * peakPerMz);
    let expectedScans = Math.ceil((maxrt - minrt) * scanPerRt);
    let totalExpectedPeaks = expectedPeaks * expectedScans; 
    let minDiff = Infinity;
    let tableNum = 0;
    
    if (totalExpectedPeaks >= peakCount[0])
    {
        for (let i = 0; i < peakCount.length; i++)
        {
            //find which level has the closet number of peaks with totalExpectedPeaks
            let diff = Math.abs(peakCount[i] - totalExpectedPeaks);
            if (diff < minDiff )
            {
                tableNum = peakCount.length - 1 - i;
                minDiff = diff;
            } 
        }
        console.log("the selected table is PEAKS" , tableNum);
    }
    else
    {
        console.log("the selected table is PEAKS");
        tableNum = ''//if range very small, always use the largest table
    }
    
    let sql = `SELECT *
                FROM PEAKS` + tableNum.toString() + 
                ` WHERE RETENTIONTIME <= ? 
                AND RETENTIONTIME >= ?
                AND MZ <= ?
                AND MZ >= ?
                ORDER BY INTENSITY DESC;`;
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