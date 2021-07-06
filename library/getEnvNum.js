/**
 * Get envelope information by scanID.
 * @param {sqliteDB} resultDB - Sqlite database
 * @param {string} scanid - Scan number
 * @param {function} callback - Callback function that handles query results
 * @returns {function} Callback function
 */
function getEnvNum(resultDB, scanid,callback) {
    let stmt = resultDB.prepare(`SELECT envelope_id AS id,mono_mass AS mono_mass, charge AS charge
    FROM envelope INNER JOIN SPECTRA ON envelope.scan_id = SPECTRA.SCAN
    WHERE SPECTRA.SCAN = ?`);
    let rows = stmt.all(scanid);

    resultDB.close();
    
    callback(null, rows);
}
module.exports = getEnvNum;