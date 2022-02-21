"use strict";
var BetterDB = require("better-sqlite3");
/**
 * Update project name by given projectCode. Sync mode.
 * @param {string} projectName - Project name
 * @param {string} projectCode - Project code
 */
function updateProjectNameSync(projectName, projectCode) {
    const resultDb = new BetterDB('./db/projectDB.db');
    let stmt = resultDb.prepare(`UPDATE Projects
                SET ProjectName = ?
                WHERE ProjectCode = ?`);
    let info = stmt.run(projectName, projectCode);
    console.log('updateProjectNameSync info', info);
    resultDb.close();
}
module.exports = updateProjectNameSync;
