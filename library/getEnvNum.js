const sqlite3 = require('sqlite3').verbose();
/**
 * Get envelope information by scanID. Async mode.
 * @param {sqliteDB} resultDB
 * @param {string} scanid
 * @param {function} callback
 * @async
 */
function getEnvNum(resultDB, scanid,callback) {
    let sql = `SELECT envelope_id AS id,mono_mass AS mono_mass, charge AS charge
                FROM envelope INNER JOIN SPECTRA ON envelope.scan_id = SPECTRA.ID
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