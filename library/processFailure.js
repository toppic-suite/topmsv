var BetterDB = require("better-sqlite3");
/**
 * Update project status code to 2 by projectCode. Sync mode.
 * @param {string} id - Project code
 * @param {function} callback - Callback function that handles the query results
 * @returns {function} Callback function
 * 
 */
function processFailure(id, callback) {
    let db = new BetterDB('./db/projectDB.db', (err) => {
        if (err) {
            console.error(err.message);
        }
        // console.log('Connected to the result database.');
    });
    let stmt = db.prepare(`UPDATE Projects
                SET ProjectStatus = 2
                WHERE ProjectCode = ?`);
    let info = stmt.run(id);
    console.log('info', info);
    db.close();
    return callback(null);
}
module.exports = processFailure;