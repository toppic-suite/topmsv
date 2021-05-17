const sqlite3 = require('sqlite3').verbose();
/**
 * Get all tasks of one user. Async mode.
 * @param {number} pcode - project code
 * @param {function} callback - Callback function that handles query results
 * @returns {function} Callback function
 * @async
 */
function getTasksPerUser(pcode,callback) {
    let db = new sqlite3.Database("./db/projectDB.db", (err) => {
        if (err) {
            console.error(err.message);
        }
        // console.log('Connected to the result database.');
    });
    let sql = `SELECT id AS taskId, app AS app, finish AS status, Date as startTime
                FROM Tasks
                WHERE projectCode = ?;`;
    db.all(sql,[pcode], (err, rows) => {
        if(err) {
            return callback(err);
        }else {
            return callback(rows);
        }
    });
    db.close();
}

module.exports = getTasksPerUser;