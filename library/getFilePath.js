const sqlite3 = require('sqlite3').verbose();

/**
 * Get project directory path by projectCode. Async mode.
 * @param {sqliteDB} db - Sqlite database object
 * @param {string} id - Project code
 * @param {function} callback - Callback function that handles query result
 * @returns {function} Callback function
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