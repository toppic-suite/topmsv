const BetterDB = require("better-sqlite3");

/**
 * Get all experiments under one user's specific project.
 * @param {number} uid - User ID
 * @param {number} pid - Project ID
 * @returns {array} All experiments under one user's specific project
 */
function getExperiment(uid, pid) {
    let resultDb = new BetterDB("./db/projectDB.db");
    let stmt = resultDb.prepare(`SELECT Experiment.eid as eid, Experiment.ename as ename
                FROM Project INNER JOIN Experiment ON Project.pid = Experiment.pid
                WHERE Project.uid = ? AND Experiment.pid = ?;`);
    let queryResult = stmt.all(uid, pid);
    resultDb.close();
    return queryResult;
}

module.exports = getExperiment;