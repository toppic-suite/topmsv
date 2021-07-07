const BetterDB = require('better-sqlite3'); 
/**
 * Get corresponding level one scan by given level two scan.
 * @param {string} dir - Project directory
 * @param {number} scanID - Level two scan ID
 * @param {function} callback - Callback function that handles query results
 * @returns {function} Callback function
 */
function getRelatedScan2(dir, scanID, callback) {
    let sql = `SELECT LevelTwoScanID
           FROM ScanPairs
           WHERE LevelOneScanID = ?
           LIMIT 1`;
    let dbDir = dir.substr(0, dir.lastIndexOf(".")) + ".db";
    let db = new BetterDB(dbDir);
    let stmt = db.prepare(sql);
    let rows = stmt.get(scanID);

    db.close();
    return callback(null, rows);
}
module.exports = getRelatedScan2;