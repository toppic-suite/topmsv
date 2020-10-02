const sqlite3 = require('sqlite3').verbose();
/**
 * Get corresponding level one scan by given level two scan. Async mode.
 * @param {string} dir - Project directory
 * @param {number} scanID - Level two scan ID
 * @param {function} callback - Callback function that handles query results
 * @returns {function} Callback function
 * @async
 */

function getRelatedScan2(dir, scanID, callback) {
    let sql = `SELECT LevelOneScanID
           FROM ScanPairs
           WHERE LevelTwoScanID = ?
           LIMIT 1`;
    let dbDir = dir.substr(0, dir.lastIndexOf(".")) + ".db";
    let resultDb = new sqlite3.Database(dbDir, (err) => {
        if (err) {
            console.error(err.message);
        }
        //console.log('Connected to the result database.');
    });
    resultDb.get(sql, [scanID], (err, row) => {
        console.log("row:", row);
        if (err) {
            console.log(error);
            throw err;
        }
        return callback(null, row);
    });
    resultDb.close();
}
module.exports = getRelatedScan2;