const sqlite3 = require('sqlite3').verbose();
/**
 * Update task status by taskID. Async mode.
 * @param {number} status
 * @param {number} taskID
 * @param {callback} callback
 * @async
 * @deprecated
 */
function updateTaskStatusAsync(status, taskID, callback) {
    let db = new sqlite3.Database('./db/projectDB.db', (err) => {
        if (err) {
            console.error(err.message);
        }
        // console.log('Connected to the result database.');
    });
    let sql = `UPDATE Tasks
                SET finish = ?
                WHERE id = ?`;
    db.run(sql, [status,taskID], function (err) {
        if (err) {
            return console.error(err.message);
        }
        console.log(`Row(s) updated: ${this.changes}`);
        return callback(null);
    });
    db.close();
}
module.exports = updateTaskStatusAsync;