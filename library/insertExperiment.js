const BetterDB = require("better-sqlite3");
/**
 * Insert new project information into database. Sync mode.
 * @param {string} ProjectName - Project name
 * @param {number} uid - User ID
 */
function insertExperiment(ename,pid,description) {
    let resultDb = new BetterDB('./db/projectDB.db');
    let stmt = resultDb.prepare('INSERT INTO Experiment(ename,pid,description) VALUES(?,?,?)');
    let info = stmt.run(ename, pid,description);
    console.log("insertExperiment info", info);
    resultDb.close();
}
module.exports = insertExperiment;