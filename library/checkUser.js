const BetterDB = require('better-sqlite3');
/**
 * Get user's information by given uid. Sync mode.
 * @param {string} uid - uid
 * @returns {Object} Object contains user information
 */
function checkUser(uid) {
    let resultDb = new BetterDB('./db/projectDB.db');
    let stmt = resultDb.prepare(`SELECT *
                                FROM Users
                                WHERE uid = ?;`);
    let queryResult = stmt.get(uid);
    resultDb.close();
    return queryResult;
}
module.exports = checkUser;