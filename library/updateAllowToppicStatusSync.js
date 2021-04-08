const BetterDB = require("better-sqlite3");
/**
 * Update envelope status code by projectCode. Sync mode.
 * @param {number} status - Envelope status code
 * @param {string} id - Project code
 */
function updateAllowToppicStatusSync(status, id) {
    let resultDb = new BetterDB('./db/projectDB.db');
    let stmt = resultDb.prepare(`UPDATE Projects
                SET allowToppic = ?
                WHERE ProjectCode = ?`);
    let info = stmt.run(status, id);
    resultDb.close();
}
module.exports = updateAllowToppicStatusSync;