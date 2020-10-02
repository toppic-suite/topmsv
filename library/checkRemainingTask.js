const BetterDB = require('better-sqlite3');
/**
 * Check if one project has remaining tasks to do. Sync mode.
 * @param {string} projectCode - Project code
 * @returns {number} 0 if no remaining tast, 1 if exists remaining tasks
 */
function checkRemainingTask(projectCode) {
    let resultDb = new BetterDB('./db/projectDB.db');
    let stmt = resultDb.prepare(`SELECT Projects.ProjectStatus AS projectStatus
                                FROM Tasks INNER JOIN Projects ON Tasks.projectCode = Projects.ProjectCode
                                WHERE Tasks.projectCode = ? AND Tasks.finish = 0;`);
    let queryResult = stmt.get(projectCode);
    resultDb.close();

    if (queryResult === undefined) {
        return 0;
    } else {
        return 1;
    }
}

module.exports = checkRemainingTask;