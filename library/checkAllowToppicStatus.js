"use strict";
const BetterDB = require('better-sqlite3');
/**
 * Get allowToppic status by Tasks.projectCode. Sync mode.
 * @param {string} projectCode - Project Code
 * @returns {Object} Object contains projectStatus
 */
function checkAllowToppicStatus(projectCode, callback) {
    let db = new BetterDB('./db/projectDB.db');
    let stmt = db.prepare(`SELECT allowToppic AS allowToppic FROM Projects WHERE projectCode = ?;`);
    let info = stmt.get(projectCode);
    db.close();
    return callback(null, info);
}
module.exports = checkAllowToppicStatus;
