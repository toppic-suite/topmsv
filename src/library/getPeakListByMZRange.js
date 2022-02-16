"use strict";
const BetterDB = require("better-sqlite3");
/**
 * Get one given scan's peak mz and intensity where peaks' mz are between min and max. Sync mode.
 * @param {string} dir - Project directory
 * @param {number} min - Minimum peak mz
 * @param {number} max - Maximum peak mz
 * @param {number} scan - Scan ID
 * @returns {array} Peak mz and intensity within specific mz range
 */
function getPeakListByMZRange(dir, min, max, scan) {
    let dbDir = dir.substr(0, dir.lastIndexOf(".")) + ".db";
    let resultDB = new BetterDB(dbDir);
    let stmt = resultDB.prepare('SELECT PEAKS.MZ AS mz, PEAKS.INTENSITY AS intensity ' +
        'FROM PEAKS INNER JOIN SPECTRA ON PEAKS.SPECTRAID = SPECTRA.SCAN ' +
        'WHERE SPECTRA.SCAN = ? AND PEAKS.mz <= ? AND PEAKS.mz >= ?;');
    let peakList = stmt.all(scan, max, min);
    resultDB.close();
    return peakList;
}
module.exports = getPeakListByMZRange;
