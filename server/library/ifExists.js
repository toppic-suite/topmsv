"use strict";
const BetterDB = require('better-sqlite3');
/**
 * Check if there were an existing projectCode.
 * @param {string} base64_code - Base64 code
 * @param {function} callback - Callback function that handles query results
 * @returns {function} Callback function
 */
function ifExists(base64_code, callback) {
    let db = new BetterDB('./db/projectDB.db');
    let sql = `SELECT ProjectID as id
             FROM Projects
             WHERE ProjectCode  = ?`;
    // first row only
    let stmt = db.prepare(sql);
    let row = stmt.get(base64_code);
    db.close();
    if (row === undefined) {
        return callback(null, false);
    }
}
module.exports = ifExists;
