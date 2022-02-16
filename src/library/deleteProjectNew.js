"use strict";
const BetterDB = require("better-sqlite3");
/**
 * Delete project info from database by given project ID. Sync mode.
 * @param {number} pid - Project ID
 */
function deleteProject(pid) {
    let resultDb = new BetterDB("./db/projectDB.db");
    let stmt = resultDb.prepare(`DELETE FROM Project WHERE pid = ?;`);
    let info = stmt.run(pid);
    resultDb.close();
}
module.exports = deleteProject;
