const BetterDB = require('better-sqlite3');
/**
 * Get project status by Tasks.projectCode. Sync mode.
 * @param {string} projectCode - Project Code
 * @returns {Object} Object contains projectStatus
 */
function checkProjectStatusSync(projectCode) {
    let resultDb = new BetterDB('./db/projectDB.db');
    let stmt = resultDb.prepare(`SELECT Projects.ProjectStatus AS projectStatus
                                FROM Tasks INNER JOIN Projects ON Tasks.projectCode = Projects.ProjectCode
                                WHERE Tasks.projectCode = ?;`);
    let queryResult = stmt.get(projectCode);
    resultDb.close();
    return queryResult;
}
module.exports = checkProjectStatusSync;