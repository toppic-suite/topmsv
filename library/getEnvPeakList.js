const sqlite3 = require('sqlite3').verbose();
/**
 * Get list of envelope peaks information. Async mode.
 * @param {sqliteDB} resultDB - Sqlite database object
 * @param {number} envelope_id - Envelope ID
 * @param {function} callback - Callback function that handles query results
 * @returns {function} Callback function
 * @async
 */
function getEnvPeakList(resultDB, envelope_id, callback) {
    let sql = `SELECT mz, intensity
                FROM env_peak
                WHERE envelope_id = ?`;
    resultDB.all(sql, [envelope_id], (err, rows) => {
        if (err) {
            throw err;
        }
        return callback(null,rows);
    });
    //db.close();
}
module.exports = getEnvPeakList;