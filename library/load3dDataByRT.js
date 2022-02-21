"use strict";
const BetterDB = require('better-sqlite3');
/**
 * Get scan of next level one.
 * @param {string} dir - Project directory
 * @param {number} tableNum - database table number to get peaks from
 * @param {number} minmz - minimum m/z
 * @param {number} maxmz - maximum m/z
 * @param {function} callback
 */
function load3dDataByRT(dir, rt, tableNum, minmz, maxmz, callback) {
    let sql = `SELECT *
                FROM PEAKS` + tableNum +
        ` WHERE RETENTIONTIME = ?
                AND MZ >= ?
                AND MZ <= ?;`;
    let dbDir = dir;
    let db = new BetterDB(dbDir);
    let stmt = db.prepare(sql);
    let rows = stmt.all(rt, minmz, maxmz);
    db.close();
    return callback(null, rows);
}
module.exports = load3dDataByRT;
