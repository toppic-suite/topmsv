const sqlite3 = require('sqlite3').verbose();
/**
 * Update project status code to 2 by projectCode. Async mode.
 * @param {string} id
 * @param {function} callback
 * @async
 */
function processFailure(id, callback) {
    let db = new sqlite3.Database('./db/projectDB.db', (err) => {
        if (err) {
            console.error(err.message);
        }
        // console.log('Connected to the result database.');
    });
    let sql = `UPDATE Projects
                SET ProjectStatus = 2
                WHERE ProjectCode = ?`;
    db.run(sql, [id], function (err) {
        if (err) {
            return console.error(err.message);
        }
        console.log(`Row(s) updated: ${this.changes}`);
        return callback(null);
    });
    db.close();
}
module.exports = processFailure;