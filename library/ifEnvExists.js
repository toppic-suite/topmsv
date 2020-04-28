const sqlite3 = require('sqlite3').verbose();
/**
 * Check if there were an existing envelope information. Async mode.
 * @param {object} db
 * @param {string} ProjectCode
 * @param {function} callback
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