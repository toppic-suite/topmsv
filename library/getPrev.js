"use strict";
const BetterDB = require('better-sqlite3');
/**
 * Get prev scan by given scan.
 * @param {string} dir - Project directory
 * @param {number} scanID - Scan number
 * @param {function} callback - Callback function that handles query results
 * @returns {function} Callback function
 */
function getPrev(dir, scanID, callback) {
    let sql = `SELECT PREV AS prev
           FROM SPECTRA
           WHERE SCAN = ?`;
    let dbDir = dir.substr(0, dir.lastIndexOf(".")) + ".db";
    let db = new BetterDB(dbDir);
    let stmt = db.prepare(sql);
    let row = stmt.get(scanID);
    db.close();
    return callback(null, row);
}
module.exports = getPrev;
