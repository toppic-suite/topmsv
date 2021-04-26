const sqlite3 = require('sqlite3').verbose();
/**
 * Update proteoform of sequence table by scan. Sync Mode.
 * @param {string} projectCode - Project code
 */
function updateExpDate(projectCode, callback) {
    let db = new sqlite3.Database('./db/projectDB.db', (err) => {
        if (err) {
            console.error(err.message);
        }
    });
    var sql = `UPDATE Projects
            SET Date = CURRENT_TIMESTAMP
            WHERE ProjectCode = ?;`;

    db.run(sql, [projectCode], function (err) {
        if (err) {
            callback(err);
        }
        console.log(`Date updated: ${this.changes}`);
        return callback("success");
    });
    db.close();
}

module.exports = updateExpDate;