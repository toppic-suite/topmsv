const BetterDB = require('better-sqlite3'); 
/**
 * Get retention time by given scan.
 * @param {string} dir - Project directory
 * @param {number} scanNum  - Scan number
 * @param {function} callback - Callback function that handles query results
 * @returns {function} Callback function
 */
function getRTAsync(dir, scanNum, callback) {
    let sql = `SELECT RETENTIONTIME AS rt
                FROM SPECTRA
                WHERE SCAN = ?`;
    let dbDir = dir.substr(0, dir.lastIndexOf(".")) + ".db";
    let db = new BetterDB(dbDir);
    let stmt = db.prepare(sql);
    let row = stmt.get(scanNum);

    db.close();

    return callback(null, row);
}
module.exports = getRTAsync;