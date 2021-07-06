const BetterDB = require('better-sqlite3'); 
/**
 * Get envelope charge by envelope_id. 
 * @param {sqliteDB} resultDB - sqlite database object
 * @param {number} envelope_id - Envelope id
 * @param {function} callback - Callback function that handles query results
 * @deprecated
 */
function getEnvCharge(resultDB, envelope_id, callback) {
    let sql = `SELECT mono_mass AS mono_mass, charge AS charge
                FROM envelope
                WHERE envelope_id = ?`;

    let db = new BetterDB(dbDir);

    let stmt = db.prepare(sql);
    let row = stmt.all();
    
    db.close();

    return callback(null, row);
}
module.exports = getEnvCharge;