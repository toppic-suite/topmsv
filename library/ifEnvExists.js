const sqlite3 = require('sqlite3').verbose();
/**
 * Check if there were an existing envelope information. Async mode.
 * @param {sqliteDB} db - Sqlite database object
 * @param {string} ProjectCode  - Project code
 * @param {function} callback - Callback function that handles query results
 * @returns {function} Callback function
 * @async
 */
function ifEnvExists(ProjectCode, callback) {
    let db = new sqlite3.Database('./db/projectDB.db', (err) => {
        if (err) {
            console.error(err.message);
        }
        // console.log('Connected to the result database.');
    });
    let sql = `SELECT EnvelopeStatus
             FROM Projects
             WHERE ProjectCode  = ?`;
    db.get(sql, [ProjectCode], (err, row) => {
        if (err) {
            return callback(err);
        }
        else {
            return callback(null, row);
        }
    });
    db.close();
}
module.exports = ifEnvExists;