"use strict";
const BetterDB = require('better-sqlite3');
/**
 * Get precurser m/z by given scan.
 * @param {string} dir - Project directory
 * @param {number} scan - Scan number
 * @param {function} callback - Callback function that handles query results
 * @returns {function} Callback function
 */
function getPrecMZ(dir, scan, callback) {
    let sql = `SELECT PREC_MZ AS precMZ
           FROM SPECTRA
           WHERE SCAN = ?`;
    let dbDir = dir.substr(0, dir.lastIndexOf(".")) + ".db";
    let db = new BetterDB(dbDir);
    let stmt = db.prepare(sql);
    let row = stmt.get(scan);
    db.close();
    return callback(null, row);
}
module.exports = getPrecMZ;
