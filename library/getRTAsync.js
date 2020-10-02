const sqlite3 = require('sqlite3').verbose();
/**
 * Get retention time by given scan. Async mode.
 * @param {string} dir - Project directory
 * @param {number} scanNum  - Scan number
 * @param {function} callback - Callback function that handles query results
 * @returns {function} Callback function
 * @async
 */
function getRTAsync(dir, scanNum, callback) {
    let sql = `SELECT RETENTIONTIME AS rt
                FROM SPECTRA
                WHERE SCAN = ?`;
    let dbDir = dir.substr(0, dir.lastIndexOf(".")) + ".db";
    let resultDb = new sqlite3.Database(dbDir, (err) => {
        if (err) {
            console.error(err.message);
        }
        // console.log('Connected to the result database.');
    });
    resultDb.get(sql,[scanNum], (err, row) => {
        if (err) {
            console.error(err.message);
        }
        //console.log(row);
        return callback(null, row);
    });
    resultDb.close();
}
module.exports = getRTAsync;