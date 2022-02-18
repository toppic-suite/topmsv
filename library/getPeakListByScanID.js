"use strict";
const BetterDB = require('better-sqlite3');
/**
 * Get a list of corresponding peaks by given scanID.
 * @param {string} dir - Project directory
 * @param {number} scan_id - Scan ID
 * @param {function} callback - Callback function that handles query results
 * @returns {function} Callback function
 */
module.exports = function getPeakListByScanID(dir, scan_id, callback) {
    let sql = `SELECT MZ AS mz,
                INTENSITY AS intensity
                FROM PEAKS
                WHERE SPECTRAID = ?;`;
    let dbDir = dir.substr(0, dir.lastIndexOf(".")) + ".db";
    let db = new BetterDB(dbDir);
    let stmt = db.prepare(sql);
    let rows = stmt.all(scan_id);
    db.close();
    return callback(rows);
};
// module.exports = {getPeakListByScanID};
