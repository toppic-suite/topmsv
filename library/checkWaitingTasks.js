const sqlite3 = require('sqlite3').verbose();

/**
 * Get the first task on waitlist. Async mode.
 * @param {function} callback
 * @async
 */
function checkWaitingTasks(callback) {
    let db = new sqlite3.Database('./db/projectDB.db', (err) => {
        if (err) {
            console.error(err.message);
        }
    });
    let sql = `SELECT Tasks.mzmlFile AS mzmlFile, Tasks.envFile AS envFile, Tasks.processEnv AS processEnv, Projects.ProjectName AS projectName, Projects.FileName AS fname, Projects.Email AS email
                FROM Tasks INNER JOIN Projects ON Tasks.projectCode = Projects.ProjectCode
                WHERE Projects.ProjectStatus = 4
                LIMIT 1;`;
    db.get(sql, (err, row) => {
        if (err) {
            throw err;
        } else {
            return callback(null, row);
        }
    })
    db.close();
}
module.exports = checkWaitingTasks;