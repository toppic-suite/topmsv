const BetterDB = require('better-sqlite3'); 

/**
 * Get maximum id of envelopes.
 *
 * @param {string} dir - Project directory
 * @param {function} callback - Callback function that handles query results
 * @returns {function} Callback function
 */

function getEnvMax(dir, callback){
    let sql = `SELECT MAX(envelope_id) AS maxID
                FROM envelope`;
    let dbDir = dir.substr(0, dir.lastIndexOf(".")) + ".db";
    let db = new BetterDB(dbDir);

    let stmt = db.prepare(sql);
    let row = stmt.get();

    db.close();

    return callback(row.maxID);
}
module.exports = getEnvMax;