const BetterDB = require('better-sqlite3'); 
/**
 * Update proteoform of sequence table by scan. Sync Mode.
 * @param {string} projectCode - Project code
 */
function updateExpDate(projectCode, callback) {
    let db = new BetterDB('./db/projectDB.db', (err) => {
        if (err) {
            console.error(err.message);
        }
    });
    var sql = `UPDATE Projects
            SET Date = CURRENT_TIMESTAMP
            WHERE ProjectCode = ?;`;

    let stmt = db.prepare(sql);
    let rows = stmt.run(projectCode);
    db.close();

    console.log(`Date updated: ${rows.changes}`);
    return callback("success");
}

module.exports = updateExpDate;