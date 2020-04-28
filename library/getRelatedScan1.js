const sqlite3 = require('sqlite3').verbose();
/**
 * Get the first related scan level two scan by given scan level one scan. Async mode.
 * @param {string} dir
 * @param {number} scanID
 * @param {function} callback
 * @async
 */
function getRelatedScan1(dir, scanID, callback) {
    let sql = `SELECT LevelTwoScanID
           FROM ScanPairs
           WHERE LevelOneScanID = ?
           LIMIT 1`;
    let dbDir = dir.substr(0, dir.lastIndexOf(".")) + ".db";
    let resultDb = new sqlite3.Database(dbDir, (err) => {
        if (err) {
            console.error(err.message);
        }
        //console.log('Connected to the result database.');
    });
    resultDb.get(sql, [scanID], (err, row) => {
        if (err) {
            throw err;
        }
        return callback(null, row);
    });
    resultDb.close();
}
module.exports = getRelatedScan1;