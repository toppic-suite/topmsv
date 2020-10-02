const sqlite3 = require('sqlite3').verbose();
/**
 * Get scan by given scan ID. Async mode.
 * @param {string} dir - Project directory
 * @param {number} id - Scan ID
 * @param {function} callback - Callback function that handles query results
 * @returns {function} Callback function
 * @async
 */

function getScanID(dir, id, callback) {
    let sql = `SELECT SCAN AS scanID
           FROM SPECTRA
           WHERE ID = ?`;
    let dbDir = dir.substr(0, dir.lastIndexOf(".")) + ".db";
    let resultDb = new sqlite3.Database(dbDir, (err) => {
        if (err) {
            console.error(err.message);
        }
        //console.log('Connected to the result database.');
    });
    resultDb.get(sql, [id], (err, row) => {
        if (err) {
            throw err;
        }
        return callback(null, row);
    });
    resultDb.close();
}
module.exports = getScanID;