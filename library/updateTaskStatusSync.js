const BetterDB = require("better-sqlite3");
/**
 * Update task status code by taskID. Sync mode.
 * @param {number} status - Task finish status code
 * @param {number} taskID - Task ID
 */
function updateTaskStatusSync(status, taskID) {
    let resultDb = new BetterDB('./db/projectDB.db');
    let stmt = resultDb.prepare(`UPDATE Tasks
                SET finish = ?
                WHERE id = ?`);
    let info = stmt.run(status, taskID);
    // console.log('info', info);
    resultDb.close();
}
module.exports = updateTaskStatusSync;