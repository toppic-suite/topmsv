const BetterDB = require('better-sqlite3'); 
/**
 * Get all envelope information of one scan by scanID.
 * @param {string} dir - Project directory
 * @param {number} scanID - Scan number
 * @param {function} callback - Callback function that handles query results
 * @returns {function} Callback
 */
function getEnvTable(dir, scanID, callback){
    let sql = `SELECT envelope_id,scan_id, charge, mono_mass, intensity
                FROM envelope INNER JOIN SPECTRA ON envelope.scan_id = SPECTRA.SCAN
                WHERE SPECTRA.SCAN = ?`;
    let dbDir = dir.substr(0, dir.lastIndexOf(".")) + ".db";
    let db = new BetterDB(dbDir);

    let stmt = db.prepare(sql);
    let rows = stmt.all(scanID);

    db.close();

    return callback(null, rows);
}
module.exports = getEnvTable;