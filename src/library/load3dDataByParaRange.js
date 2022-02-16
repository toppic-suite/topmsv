"use strict";
const BetterDB = require('better-sqlite3');
/**
 * Get scan of next level one.
 * @param {string} dir - Project directory
 * @param {number} tableNum - database table number to get peaks from
 * @param {number} minrt - minimum retention time
 * @param {number} maxrt - maximum retention time
 * @param {number} minmz - minimum m/z
 * @param {number} maxmz - maximum m/z
 * @param {number} maxPeaks - maximum number of peaks to be returned
 * @param {function} callback - Callback function that handles query results
 * @returns {function} Callback function
 */
function load3dDataByParaRange(dir, tableNum, minrt, maxrt, minmz, maxmz, maxPeaks, cutoff, callback) {
    let sql = `SELECT *
                FROM PEAKS` + tableNum +
        ` WHERE RETENTIONTIME <= ? 
                AND RETENTIONTIME >= ?
                AND MZ <= ?
                AND MZ >= ?
                AND INTENSITY > ?
                ORDER BY INTENSITY DESC
                LIMIT ?;`;
    let dbDir = dir;
    let db = new BetterDB(dbDir);
    let stmt = db.prepare(sql);
    let rows = stmt.all(maxrt, minrt, maxmz, minmz, cutoff, maxPeaks);
    db.close();
    return callback(null, rows);
}
module.exports = load3dDataByParaRange;
