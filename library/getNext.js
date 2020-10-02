const sqlite3 = require('sqlite3').verbose();
/**
 * Get next scan by given scan. Async mode.
 * @param {string} dir - Project directory
 * @param {number} scanID - Scan number
 * @param {function} callback - Callback function that handles query results.
 * @returns {function} Callback function
 */
function getNext(dir, scanID, callback) {
    let sql = `SELECT NEXT AS next
           FROM SPECTRA
           WHERE SCAN = ?`;
    let dbDir = dir.substr(0, dir.lastIndexOf(".")) + ".db";
    let resultDb = new sqlite3.Database(dbDir, (err) => {
        if (err) {
            console.error(err.message);
        }
        //console.log('Connected to the result database.');
    });
    resultDb.get(sql, [scanID], (err, row) => {
        if (err) {
            throw err;
        }
        return callback(null, row);
    });
    resultDb.close();
}
module.exports = getNext;