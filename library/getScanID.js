const BetterDB = require('better-sqlite3'); 
/**
 * Get scan by given scan ID. 
 * @param {string} dir - Project directory
 * @param {number} id - Scan ID
 * @param {function} callback - Callback function that handles query results
 * @returns {function} Callback function
 */

function getScanID(dir, id, callback) {
    let sql = `SELECT SCAN AS scanID
           FROM SPECTRA
           WHERE SCAN = ?`;
    let dbDir = dir.substr(0, dir.lastIndexOf(".")) + ".db";
    let db = new BetterDB(dbDir);
    let stmt = db.prepare(sql);
    let rows = stmt.get(id);

    db.close();

    return callback(null, rows);
}
module.exports = getScanID;