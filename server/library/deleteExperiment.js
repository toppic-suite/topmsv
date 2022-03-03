"use strict";
const BetterDB = require("better-sqlite3");
/**
 * Delete experiment from database by given experiment ID.
 * @param {number} eid - Experiment ID
 */
function deleteExperiment(eid) {
    let resultDb = new BetterDB("./db/projectDB.db");
    let stmt = resultDb.prepare(`DELETE FROM Experiment WHERE eid = ?;`);
    let info = stmt.run(eid);
    resultDb.close();
}
module.exports = deleteExperiment;
