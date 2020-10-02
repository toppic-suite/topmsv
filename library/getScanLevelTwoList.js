const sqlite3 = require('sqlite3').verbose();
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
                    RETENTIONTIME AS rt
           FROM ScanPairs INNER JOIN SPECTRA ON ScanPairs.LevelTwoScanID = SPECTRA.SCAN
           WHERE LevelOneScanID = ?`;
    let dbDir = dir.substr(0, dir.lastIndexOf(".")) + ".db";
    let resultDb = new sqlite3.Database(dbDir, (err) => {
        if (err) {
            console.error(err.message);
        }
    });
    resultDb.all(sql, [scanID], (err, rows) => {
        if (err) {
            throw err;
        }
        return callback(null, rows);
    });
    resultDb.close();
}
module.exports = getScanLevelTwoList;