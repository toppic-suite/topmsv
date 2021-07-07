const BetterDB = require('better-sqlite3'); 
/**
 * Update project status code to 2 by projectCode. 
 * @param {string} id - Project code
 * @param {function} callback - Callback function that handles the query results
 * @returns {function} Callback function
 */
function processFailure(id, callback) {
    let db = new BetterDB('./db/projectDB.db');
    let sql = `UPDATE Projects
                SET ProjectStatus = 2
                WHERE ProjectCode = ?`;

    let stmt = db.prepare(sql);
    let rows = stmt.run(id);

    db.close();
    console.log(`Row(s) updated: ${rows.changes}`);
    return callback(null);
}
module.exports = processFailure;