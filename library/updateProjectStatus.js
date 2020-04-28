const sqlite3 = require('sqlite3').verbose();
/**
 * Update project status code by projectID. Async mode.
 * @param {number} status
 * @param {string} id
 * @param {function} callback
 * @async
 */
function updateProjectStatus(status,id,callback) {
    let db = new sqlite3.Database('./db/projectDB.db', (err) => {
        if (err) {
            console.error(err.message);
        }
        // console.log('Connected to the result database.');
    });
    let sql = `UPDATE Projects
                SET ProjectStatus = ?
                WHERE ProjectCode = ?`;
    db.run(sql, [status,id], function (err) {
        if (err) {
            return console.error(err.message);
        }
        console.log(`Row(s) updated: ${this.changes}`);
        return callback(null);
    });
    db.close();
}
module.exports = updateProjectStatus;