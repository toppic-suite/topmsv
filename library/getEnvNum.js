const sqlite3 = require('sqlite3').verbose();
/**
 * Get envelope information by scanID. Async mode.
 * @param {sqliteDB} resultDB - Sqlite database
 * @param {string} scanid - Scan number
 * @param {function} callback - Callback function that handles query results
 * @returns {function} Callback function
 * @async
 */
function getEnvNum(resultDB, scanid,callback) {
    let sql = `SELECT envelope_id AS id,mono_mass AS mono_mass, charge AS charge
                FROM envelope INNER JOIN SPECTRA ON envelope.scan_id = SPECTRA.SCAN
				WHERE SPECTRA.SCAN = ?`;
                // FROM envelope
                // WHERE scan_id = ?`;
    resultDB.all(sql, [scanid], (err, rows) => {
        if(err) {
            throw err;
        }
        return callback(null, rows);
    });
}
module.exports = getEnvNum;