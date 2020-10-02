const sqlite3 = require('sqlite3').verbose();
/**
 * Get a list which contains all the tasks that finish = 0 and projectStatus = 4. Async mode.
 * @param {sqliteDB} db - Sqlite database object
 * @param {function} callback - Callback function that handles query results
 * @returns {function} Callback function
 * @async
 */
function getTaskListAsync(db, callback) {
    let sql = `SELECT Tasks.ID AS taskID, Tasks.projectCode AS projectCode, Tasks.app AS app, Tasks.parameter AS parameter, Tasks.finish AS finish, Tasks.threadNum AS threadNum, Projects.ProjectName AS projectName, Projects.FileName AS fname, Projects.Email AS email, Projects.ProjectStatus AS projectStatus
                FROM Tasks INNER JOIN Projects ON Tasks.projectCode = Projects.ProjectCode
                WHERE Tasks.finish = 0 AND Projects.ProjectStatus = 4;`;

    db.all(sql, [], (err, rows) => {
        if(err) {
            console.error(err.message);
            throw err;
        }
        return callback(err, rows);
    });
}

module.exports = getTaskListAsync;