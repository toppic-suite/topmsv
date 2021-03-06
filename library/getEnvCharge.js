const sqlite3 = require('sqlite3').verbose();
/**
 * Get envelope charge by envelope_id. Async mode.
 * @param {sqliteDB} resultDB - sqlite database object
 * @param {number} envelope_id - Envelope id
 * @param {function} callback - Callback function that handles query results
 * @deprecated
 */
function getEnvCharge(resultDB, envelope_id, callback) {
    let sql = `SELECT mono_mass AS mono_mass, charge AS charge
                FROM envelope
                WHERE envelope_id = ?`;
    resultDB.get(sql, [envelope_id], (err, row) => {
        if(err) {
            throw err;
        }
        return callback(null, row);
    });
    //db.close();
}
module.exports = getEnvCharge;