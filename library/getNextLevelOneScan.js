const BetterDB = require('better-sqlite3'); 
/**
 * Get scan of next level one. 
 * @param {string} dir - Project directory
 * @param {number} scanNum - Scan number
 * @param {function} callback - Callback function that handles query results
 * @returns {function} Callback function
 */
function getNextLevelOneScan(dir, scanNum, callback) {
    let sql = `SELECT SCAN AS scan
                FROM SPECTRA
                WHERE SCAN > ? AND SCANLEVEL =2
                LIMIT 1;`;
    let dbDir = dir.substr(0, dir.lastIndexOf(".")) + ".db";
    let db = new BetterDB(dbDir);
    let stmt = db.prepare(sql);
    let row = stmt.get(scanNum);

    db.close();

    return callback(null, row);
}
module.exports = getNextLevelOneScan;