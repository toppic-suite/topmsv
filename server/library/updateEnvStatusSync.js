"use strict";
const BetterDB = require("better-sqlite3");
/**
 * Update envelope status code by projectCode. Sync mode.
 * @param {number} status - Envelope status code
 * @param {string} id - Project code
 */
function updateEnvStatusSync(status, id) {
    let resultDb = new BetterDB('./db/projectDB.db');
    let stmt = resultDb.prepare(`UPDATE Projects
                SET EnvelopeStatus = ?
                WHERE ProjectCode = ?`);
    let info = stmt.run(status, id);
    resultDb.close();
}
module.exports = updateEnvStatusSync;
