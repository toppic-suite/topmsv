"use strict";
const BetterDB = require("better-sqlite3");
/**
 * Get all experiments of one project
 * @param {number} pid - Project ID
 * @returns {array} All experiments of specific project
 */
function getExperimentByPid(pid) {
    let resultDb = new BetterDB("./db/projectDB.db");
    let stmt = resultDb.prepare(`SELECT Experiment.eid as eid, Experiment.ename as ename
                FROM Experiment
                WHERE Experiment.pid = ?;`);
    let queryResult = stmt.all(pid);
    resultDb.close();
    return queryResult;
}
module.exports = getExperimentByPid;
