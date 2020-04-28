const sqlite3 = require('sqlite3').verbose();

/**
 * Get project directory path by projectCode. Async mode.
 * @param {sqliteDB} db
 * @param {string} id
 * @param {function} callback
 * @async
 */

function getFilePath(db, id, callback) {
    let sql = `SELECT ProjectDir AS dir
             FROM Projects
             WHERE ProjectCode  = ?`;

    db.get(sql, [id], (err, row) => {
        if (err) {
            return callback(err);
        }
        else {
            return callback(null, row.dir);
        }
    });
}
module.exports = getFilePath;