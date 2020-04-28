const BetterDB = require("better-sqlite3");
/**
 * Update project status code by projectCode. Sync mode.
 * @param {number} status
 * @param {string} projectCode
 */
function updateProjectStatusSync(status, projectCode) {
    let resultDb = new BetterDB('./db/projectDB.db');
    let stmt = resultDb.prepare(`UPDATE Projects
                SET ProjectStatus = ?
                WHERE ProjectCode = ?`);
    let info = stmt.run(status, projectCode);
    console.log('info', info);
    resultDb.close();
}

module.exports = updateProjectStatusSync;