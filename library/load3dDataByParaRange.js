const sqlite3 = require('sqlite3').verbose();
/**
 * Get scan of next level one. Async mode.
 * @param {string} dir - Project directory
 * @param {number} tableNum - database table number to get peaks from
 * @param {number} minrt - minimum retention time
 * @param {number} maxrt - maximum retention time
 * @param {number} minmz - minimum m/z
 * @param {number} maxmz - maximum m/z
 * @param {number} maxPeaks - maximum number of peaks to be returned
 * @param {function} callback - Callback function that handles query results
 * @returns {function} Callback function
 * @async
 */
function load3dDataByParaRange(dir, tableNum, minrt, maxrt, minmz, maxmz, maxPeaks, callback) {
    /*let sql = `SELECT *
                FROM PEAKS` + tableNum + 
                ` WHERE RETENTIONTIME <= ? 
                AND RETENTIONTIME >= ?
                AND MZ <= ?
                AND MZ >= ?
                ORDER BY INTENSITY DESC;`;*/
    let sql = `SELECT *
                FROM PEAKS` + tableNum + 
                ` WHERE RETENTIONTIME <= ? 
                AND RETENTIONTIME >= ?
                AND MZ <= ?
                AND MZ >= ?
                ORDER BY INTENSITY DESC
                LIMIT ?;`;           
    let dbDir = dir;
    let resultDb = new sqlite3.Database(dbDir, (err) => {
        if (err) {
            console.error("error during db generation", err.message);
        }
       // console.log('Connected to the result database.');
    });

    resultDb.all(sql, [maxrt, minrt, maxmz, minmz, maxPeaks], (err, row) => {
        if (err) {
            console.error(err.message);
        }
        return callback(null, row);
    });
    resultDb.close();
}
module.exports = load3dDataByParaRange;
