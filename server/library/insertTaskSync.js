"use strict";
const BetterDB = require("better-sqlite3");
/**
 * Insert a new task to waitlist. Sync mode.
 * @param {string} projectCode - Project code
 * @param {string} app - The application that is going to run for this task
 * @param {string} parameter - The parameter for this task
 * @param {number} threadNum - Thread number to run this task
 * @param {number} finish - Finish status code
 */
function insertTaskSync(projectCode, app, parameter, threadNum, finish) {
    let resultDb = new BetterDB('./db/projectDB.db');
    let stmt = resultDb.prepare('INSERT INTO Tasks(projectCode, app, parameter, threadNum, finish) VALUES(?,?,?,?,?)');
    let info = stmt.run(projectCode, app, parameter, threadNum, finish);
    console.log("insertTaskSync info", info);
    resultDb.close();
}
module.exports = insertTaskSync;
