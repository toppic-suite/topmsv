const BetterDB = require('better-sqlite3'); 
/**
 * Get all information of one envelope by given envelope_id. Async mode.
 *
 * @param {string} dir - Project directory
 * @param {number} envID - Envelope ID
 * @param {function} callback - Callback function that handles query results
 * @returns {function} Callback function
 * @async
 */
function getEnv(dir, envID,callback) {
    let sql = `SELECT *
                FROM envelope
                WHERE envelope_id = ?;`;
    let dbDir = dir.substr(0, dir.lastIndexOf(".")) + ".db";
    let db = new BetterDB(dbDir);

    let stmt = db.prepare(sql);
    let row = stmt.all();
    
    db.close();

    return callback(row);
}
module.exports = getEnv;