"use strict";
const BetterDB = require('better-sqlite3');
/**
 * Check if there were an existing envelope information.
 * @param {string} ProjectCode  - Project code
 * @param {function} callback - Callback function that handles query results
 * @returns {function} Callback function
 */
function ifEnvExists(ProjectCode, callback) {
    let db = new BetterDB('./db/projectDB.db');
    let sql = `SELECT EnvelopeStatus
             FROM Projects
             WHERE ProjectCode  = ?`;
    let stmt = db.prepare(sql);
    let row = stmt.get(ProjectCode);
    db.close();
    return callback(null, row);
}
module.exports = ifEnvExists;
