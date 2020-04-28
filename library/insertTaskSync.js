const BetterDB = require("better-sqlite3");
/**
 * Insert a new task to waitlist. Sync mode.
 * @param {string} projectCode
 * @param {string} app
 * @param {string} parameter
 * @param {number} threadNum
 * @param {number} finish
 */
function insertTaskSync(projectCode, app, parameter, threadNum, finish) {
    let resultDb = new BetterDB('./db/projectDB.db');
    let stmt = resultDb.prepare('INSERT INTO Tasks(projectCode, app, parameter, threadNum, finish) VALUES(?,?,?,?,?)');
    let info = stmt.run(projectCode, app, parameter, threadNum, finish);
    console.log("insertTaskSync info", info);
    resultDb.close();
}
module.exports = insertTaskSync;