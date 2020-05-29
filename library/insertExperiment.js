const BetterDB = require("better-sqlite3");
/**
 * Insert new project information into database. Sync mode.
 * @param {string} ProjectName
 * @param {string} uid
 */
function insertExperiment(ename,pid) {
    let resultDb = new BetterDB('./db/projectDB.db');
    let stmt = resultDb.prepare('INSERT INTO Experiment(ename,pid) VALUES(?,?)');
    let info = stmt.run(ename, pid);
    console.log("insertExperiment info", info);
    resultDb.close();
}
module.exports = insertExperiment;