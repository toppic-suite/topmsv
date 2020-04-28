var BetterDB = require("better-sqlite3");
/**
 * Update project name by given projectCode. Sync mode.
 * @param {string} projectName
 * @param {string} projectCode
 */
function updateProjectNameSync(projectName, projectCode) {
    const resultDb = new BetterDB('./db/projectDB.db');
    let stmt = resultDb.prepare(`UPDATE Projects
                SET ProjectName = ?
                WHERE ProjectCode = ?`);
    let info = stmt.run(projectName, projectCode);
    console.log('updateProjectNameSync info', info);
    resultDb.close();
}
module.exports = updateProjectNameSync;