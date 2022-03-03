"use strict";
const BetterDB = require("better-sqlite3");
/**
 * Delete all sequence data by projectCode. Sync Mode.
 *
 * @param {string} projectDir - Project directory
 * @param {string} projectCode - Project code
 */
function deleteSeqSync(projectDir, projectCode) {
    let dbDir = projectDir.substr(0, projectDir.lastIndexOf(".")) + ".db";
    let resultDb = new BetterDB(dbDir);
    let stmt = resultDb.prepare(`DROP TABLE IF EXISTS sequence;`);
    stmt.run();
    resultDb.close();
}
module.exports = deleteSeqSync;
