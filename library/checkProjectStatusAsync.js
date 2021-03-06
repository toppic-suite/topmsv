/**
 * Check project status by tasks.projectCode
 * @param {string} projectCode - Project code
 * @param {function} callback - Callback function that handles query results
 * @returns {function} Callback function
 * @async
 */
function checkProjectStatusAsync(projectCode, callback) {
    let db = new sqlite3.Database('./db/projectDB.db', (err) => {
        if (err) {
            console.error(err.message);
        }
    });

    let sql = `SELECT Projects.ProjectStatus AS projectStatus
                                FROM Tasks INNER JOIN Projects ON Tasks.projectCode = Projects.ProjectCode
                                WHERE Tasks.projectCode = ?;`;
    db.get(sql,[projectCode], function (err, row) {
        if (err) {
            console.error(err.message);
            return err;
        }
        return callback(err, row);
    })
    db.close();
}

module.exports = checkProjectStatusAsync;