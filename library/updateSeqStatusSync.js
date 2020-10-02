const BetterDB = require("better-sqlite3");
/**
 * Update sequence status in project table by projectCode. Sync Mode.
 * @param {number} status - Sequence status code
 * @param {string} id - Project code
 */
function updateSeqStatusSync(status,id) {
    let resultDb = new BetterDB('./db/projectDB.db');
    let stmt = resultDb.prepare(`UPDATE Projects
                SET SequenceStatus = ?
                WHERE ProjectCode = ?`);
    let info = stmt.run(status, id);
    console.log("updateSeqStatusSync Info:", info);
    resultDb.close();
}
module.exports = updateSeqStatusSync;