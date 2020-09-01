const BetterDB = require("better-sqlite3");
/**
 * Insert new project information into database. Sync mode.
 * @param {string} ProjectName
 * @param {string} uid
 */
function insertDataset(eid,dname,description, projectsID) {
    let resultDb = new BetterDB('./db/projectDB.db');
    let stmt = resultDb.prepare('INSERT INTO Dataset(eid,dname,description,projectsID) VALUES(?,?,?,?)');
    let info = stmt.run(eid, dname,description, projectsID);
    console.log("insertDataset info", info);
    resultDb.close();
}
module.exports = insertDataset;