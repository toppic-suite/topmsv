const sqlite3 = require('sqlite3').verbose();
/**
 * Get range of scan. Async mode.
 * @param {string} dir - Project directory
 * @param {function} callback - Callback function that handles query results
 * @returns {function} Callback function
 * @async
 */
function getScanRange(dir, callback) {
    let sql = `SELECT MIN(SCAN) AS minScan, MAX(SCAN) AS maxScan
                FROM SPECTRA`;
    let dbDir = dir.substr(0, dir.lastIndexOf(".")) + ".db";
    let resultDb = new sqlite3.Database(dbDir, (err) => {
        if (err) {
            console.error(err.message);
        }
        // console.log('Connected to the result database.');
    });
    resultDb.get(sql, (err, row) => {
        if (err) {
            console.error(err.message);
        }
        //console.log(row);
        return callback(null, row);
    });
    resultDb.close();
}
module.exports = getScanRange;