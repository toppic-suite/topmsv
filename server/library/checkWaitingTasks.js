"use strict";
const BetterDB = require('better-sqlite3');
/**
 * Get the first task on waitlist.
 * @param {function} callback - Callback function that handles query results
 * @returns {function} callback function
 * @async
 */
function checkWaitingTasks(callback) {
    let db = new BetterDB('./db/projectDB.db');
    let sql = `SELECT Tasks.mzmlFile AS mzmlFile, Tasks.envFile AS envFile, Tasks.processEnv AS processEnv, Projects.ProjectName AS projectName, Projects.FileName AS fname, Projects.Email AS email
                FROM Tasks INNER JOIN Projects ON Tasks.projectCode = Projects.ProjectCode
                WHERE Projects.ProjectStatus = 4
                LIMIT 1;`;
    let stmt = db.prepare(sql);
    let row = stmt.get();
    db.close();
    return callback(null, row);
}
module.exports = checkWaitingTasks;
