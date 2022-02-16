"use strict";
const BetterDB = require('better-sqlite3');
/**
 * Get maximum id of envelope peaks.
 *
 * @param {string} dir - Project directory
 * @param {function} callback - Callback function that handles query results
 * @returns {function} Callback function
 * @async
 */
module.exports = function getEnvPeakMax(dir, callback) {
    let sql = `SELECT MAX(env_peak_id) AS maxID
                FROM env_peak`;
    let dbDir = dir.substr(0, dir.lastIndexOf(".")) + ".db";
    let db = new BetterDB(dbDir);
    let stmt = db.prepare(sql);
    let row = stmt.get();
    db.close();
    return callback(row.maxID);
};
