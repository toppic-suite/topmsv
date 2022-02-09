const BetterDB = require('better-sqlite3'); 
/**
 * Get scan by given scan ID. 
 * @param {string} dir - Project directory
 * @param {number} id - Scan ID
 * @param {function} callback - Callback function that handles query results
 * @returns {function} Callback function
 */

function getScanID(dir, callback) {
    let sql = `SELECT COUNT(*) AS COUNT FROM SPECTRA WHERE SCANLEVEL=1`;
    let dbDir = dir.substr(0, dir.lastIndexOf(".")) + ".db";
    let db = new BetterDB(dbDir);
    let stmt = db.prepare(sql);
    let result = stmt.get();

    db.close();

    return callback(null, result);
}
module.exports = getScanID;