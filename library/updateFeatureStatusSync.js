const BetterDB = require("better-sqlite3");
/**
 * Update envelope status code by projectCode. Sync mode.
 * @param {number} status
 * @param {string} id
 */
function updateFeatureStatusSync(status, id) {
    let resultDb = new BetterDB('./db/projectDB.db');
    let stmt = resultDb.prepare(`UPDATE Projects
                SET FeatureStatus = ?
                WHERE ProjectCode = ?`);
    let info = stmt.run(status, id);
    resultDb.close();
}
module.exports = updateFeatureStatusSync;