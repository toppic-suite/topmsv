"use strict";
const BetterDB = require('better-sqlite3');
/**
 * Update envelope status code by projectCode.
 * @param {number} status - Envelope status code
 * @param {string} id - Project code
 * @param {function} callback - Callback function that handles the query results
 * @returns {function} Callback function
 */
function updateEnvStatus(status, id, callback) {
    let db = new BetterDB('./db/projectDB.db', (err) => {
        if (err) {
            console.error(err.message);
        }
        // console.log('Connected to the result database.');
    });
    let sql = `UPDATE Projects
                SET EnvelopeStatus = ?
                WHERE ProjectCode = ?`;
    let stmt = db.prepare(sql);
    let rows = stmt.run(status, id);
    db.close();
    console.log(`Row(s) updated: ${rows.changes}`);
    return callback(null);
}
module.exports = updateEnvStatus;
