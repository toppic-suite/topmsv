"use strict";
const BetterDB = require("better-sqlite3");
/**
 * Get all datasets under specific envelope.
 * @param {number} eid - Envelope ID
 * @returns {array} All datasets info under specific experiment
 */
function getDataset(eid) {
    let resultDb = new BetterDB("./db/projectDB.db");
    let stmt = resultDb.prepare(`SELECT Dataset.datasetID as datasetID, Dataset.dname as dname
                FROM Dataset INNER JOIN Experiment ON Dataset.eid = Experiment.eid
                WHERE Experiment.eid = ?;`);
    let queryResult = stmt.all(eid);
    resultDb.close();
    return queryResult;
}
module.exports = getDataset;
