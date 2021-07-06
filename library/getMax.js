const BetterDB = require('better-sqlite3'); 

/**
 * Get maximum and minimum mz and rt for this mzML file.
 * @param {string} dir - Project directory
 * @param {number} scanNum - Scan number
 * @param {function} callback - Callback function that handles query results.
 * @returns {function} Callback function
 */
function getMax(dir, callback) {
    let sql = `SELECT * FROM CONFIG;`;
    let dbDir = dir;
    let db = new BetterDB(dbDir);
    let stmt = db.prepare(sql);
    let rows = stmt.all();

    db.close();

    return callback(null, rows);
}
module.exports = getMax;
