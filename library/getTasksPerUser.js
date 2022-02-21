"use strict";
const BetterDB = require('better-sqlite3');
/**
 * Get all tasks of one user.
 * @param {number} pcode - project code
 * @param {function} callback - Callback function that handles query results
 * @returns {function} Callback function
 */
function getTasksPerUser(pcode, callback) {
    let db = new BetterDB("./db/projectDB.db");
    let sql = `SELECT id AS taskId, app AS app, finish AS status, Date as startTime
                FROM Tasks
                WHERE projectCode = ?;`;
    let stmt = db.prepare(sql);
    let rows = stmt.all(pcode);
    db.close();
    return callback(rows);
}
module.exports = getTasksPerUser;
