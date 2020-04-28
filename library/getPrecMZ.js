const sqlite3 = require('sqlite3').verbose();
/**
 * Get precurser m/z by given scan. Async mode.
 * @param {string} dir
 * @param {number} scan
 * @param {function} callback
 * @async
 */

function getPrecMZ(dir, scan, callback) {
    let sql = `SELECT PREC_MZ AS precMZ
           FROM SPECTRA
           WHERE SCAN = ?`;
    let dbDir = dir.substr(0, dir.lastIndexOf(".")) + ".db";
    let resultDb = new sqlite3.Database(dbDir, (err) => {
        if (err) {
            console.error(err.message);
        }
        //console.log('Connected to the result database.');
    });
    resultDb.get(sql, [scan], (err, row) => {
        if (err) {
            throw err;
        }
        return callback(null, row);
    });
    resultDb.close();
}
module.exports = getPrecMZ;