"use strict";
/**
 * Get list of envelope peaks information. Async mode.
 * @param {sqliteDB} resultDB - Sqlite database object
 * @param {number} envelope_id - Envelope ID
 * @param {function} callback - Callback function that handles query results
 * @returns {function} Callback function
 * @async
 */
function getEnvPeakList(resultDB, envelope_id, callback) {
    let stmt = resultDB.prepare(`SELECT mz, intensity FROM env_peak WHERE envelope_id = ?`);
    let rows = stmt.all(envelope_id);
    resultDB.close();
    callback(null, rows);
}
module.exports = getEnvPeakList;
