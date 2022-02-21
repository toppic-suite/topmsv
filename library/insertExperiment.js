"use strict";
const BetterDB = require("better-sqlite3");
/**
 * Insert new project information into database. Sync mode.
 * @param {string} ename - ename
 * @param {number} pid - pid
 * @param {number} description - description
 */
function insertExperiment(ename, pid, description) {
    let resultDb = new BetterDB('./db/projectDB.db');
    let stmt = resultDb.prepare('INSERT INTO Experiment(ename,pid,description) VALUES(?,?,?)');
    let info = stmt.run(ename, pid, description);
    console.log("insertExperiment info", info);
    resultDb.close();
}
module.exports = insertExperiment;
