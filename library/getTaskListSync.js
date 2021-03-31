const BetterDB = require("better-sqlite3");
/**
 * Get a list which contains all the tasks that finish = 0 and projectStatus = 4. Sync mode.
 * @returns {array} An array contains all available tasks
 */
function getTaskListSync() {
    let resultDb = new BetterDB('./db/projectDB.db');
    let stmt = resultDb.prepare(`SELECT Tasks.ID AS taskID, Tasks.projectCode AS projectCode, Tasks.app AS app, Tasks.parameter AS parameter, Tasks.finish AS finish, Tasks.threadNum AS threadNum, Projects.ProjectName AS projectName, Projects.FileName AS fname, Projects.Email AS email, Projects.ProjectStatus AS projectStatus
                FROM Tasks INNER JOIN Projects ON Tasks.projectCode = Projects.ProjectCode
                WHERE Tasks.finish = 0 AND Projects.ProjectStatus = 4;`);
    let tasksList = stmt.all();
    resultDb.close();
    return tasksList;
}
module.exports = getTaskListSync;