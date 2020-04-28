const sqlite3 = require('sqlite3').verbose();

/**
 * Check if there were an existing projectCode. Async mode.
 * @param {string} base64_code
 * @param {function} callback
 * @async
 */
function ifExists(base64_code, callback) {
    let db = new sqlite3.Database('./db/projectDB.db', (err) => {
        if (err) {
            console.error(err.message);
        }
        // console.log('Connected to the result database.');
    });
    let sql = `SELECT ProjectID as id
             FROM Projects
             WHERE ProjectCode  = ?`;
    // first row only
    db.get(sql, [base64_code], (err, row) => {
        if (err) {
            return callback(err);
        }
        else {
            if (row === undefined)
                return callback(null, false);
        }

    });
    db.close();
}
module.exports = ifExists;