const BetterDB = require("better-sqlite3");

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