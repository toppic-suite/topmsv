const BetterDB = require("better-sqlite3");

/**
 * Get all projects under specific user.
 * @param {number} uid - User ID
 * @returns {array} All projects from one user
 */
function getProjectNew(uid) {
    let resultDb = new BetterDB("./db/projectDB.db");
    let stmt = resultDb.prepare(`SELECT pid as pid, pname as projectName
                FROM Project
                WHERE uid = ?;`);
    let queryResult = stmt.all(uid);
    resultDb.close();
    return queryResult;
}

module.exports = getProjectNew;