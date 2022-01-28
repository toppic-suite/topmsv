const BetterDB = require('better-sqlite3'); 
/**
 * Get range of scan.
 * @param {string} dir - Project directory
 * @param {function} callback - Callback function that handles query results
 * @returns {function} Callback function
 */
function getScanRange(dir, callback) {
    let sql = `SELECT MIN(SCAN) AS minScan, MAX(SCAN) AS maxScan
                FROM SPECTRA`;
    let dbDir = dir.substr(0, dir.lastIndexOf(".")) + ".db";
    let db = new BetterDB(dbDir);
    let stmt = db.prepare(sql);
    let rows = stmt.get();

    db.close();

    return callback(null, rows);
}
module.exports = getScanRange;