const BetterDB = require('better-sqlite3'); 
/**
 * Get a list of level one's corresponding level two scan. Async mode.
 * @param {string} dir - Project directory
 * @param {number} scanID - Level one scan ID
 * @param {function} callback - Callback function that handles query results
 * @returns {function} Callback function
 * @async
 */

function getScanLevelTwoList(dir, scanID, callback) {
    let sql = `SELECT LevelTwoScanID AS scanID,
                    PREC_MZ AS prec_mz,
                    PREC_CHARGE AS prec_charge,
                    PREC_INTE AS prec_inte,
                    RETENTIONTIME AS rt,
                    MZ_LOW AS mz_low,
                    MZ_HIGH AS mz_high
           FROM ScanPairs INNER JOIN SPECTRA ON ScanPairs.LevelTwoScanID = SPECTRA.SCAN
           WHERE LevelOneScanID = ?`;
    let dbDir = dir.substr(0, dir.lastIndexOf(".")) + ".db";       
    let db = new BetterDB(dbDir);
    let stmt = db.prepare(sql);
    let rows = stmt.all(scanID);
    
    db.close();
    return callback(null, rows);
}
module.exports = getScanLevelTwoList;