const BetterDB = require('better-sqlite3'); 
/**
 * Get the first related scan level two scan by given scan level one scan.
 * @param {string} dir - Project directory
 * @param {number} scanID - Level one scan ID
 * @param {function} callback - Callback function that handles query results
 * @returns {function} Callback function
 */

function getRelatedScan1(dir, scanID, callback) {
    let sql = `SELECT LevelOneScanID
           FROM ScanPairs
           WHERE LevelTwoScanID = ?
           LIMIT 1`;
    let dbDir = dir.substr(0, dir.lastIndexOf(".")) + ".db";
    let db = new BetterDB(dbDir);
    let stmt = db.prepare(sql);
    let row = stmt.get(scanID);

    db.close();
    return callback(null, row);
}
module.exports = getRelatedScan1;