"use strict";
const BetterDB = require('better-sqlite3');
/**
 * Get a list of all peaks by given scan.
 *
 * @param {string} dir - Project directory
 * @param {number} scan - Scan number
 * @param {function} callback - Callback function that handles query results
 * @returns {function} Callback function
 *
 */
function getPeakList(dir, scan, callback) {
    // ORDER BY INTENSITY DESC`;
    /*let sql = `SELECT MZ AS mz,
               INTENSITY AS intensity
               FROM PEAKS INNER JOIN SPECTRA ON PEAKS.SPECTRAID = SPECTRA.SCAN
               WHERE SPECTRA.SCAN = ? `;*/
    let sql = `SELECT MZ AS mz,
               INTENSITY AS intensity
               FROM PEAKS 
               WHERE PEAKS.SPECTRAID = ? `;
    let dbDir = dir.substr(0, dir.lastIndexOf(".")) + ".db";
    let db = new BetterDB(dbDir);
    let stmt = db.prepare(sql);
    let rows = stmt.all(scan);
    db.close();
    return callback(null, rows);
}
module.exports = getPeakList;
