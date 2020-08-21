const BetterDB = require("better-sqlite3");
/**
 * Insert new project information into database. Sync mode.
 * @param {string} ProjectName
 * @param {string} uid
 */
function insertProjectNew(ProjectName,uid) {
    let resultDb = new BetterDB('./db/projectDB.db');
    let stmt = resultDb.prepare('INSERT INTO Project(pName, uid) VALUES(?,?)');
    let info = stmt.run(ProjectName, uid);
    console.log("insertProjectNew info", info);
    resultDb.close();
}
module.exports = insertProjectNew;