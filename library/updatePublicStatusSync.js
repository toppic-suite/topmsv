const BetterDB = require("better-sqlite3");
/**
 * Update project public status code by given projectCode. Sync mode.
 * @param {number} status - Public status code
 * @param {string} projectCode - Project code
 */

function updatePublicStatusSync(status, projectCode) {
    const resultDb = new BetterDB('./db/projectDB.db');
    let stmt = resultDb.prepare(`UPDATE Projects
                SET public = ?
                WHERE ProjectCode = ?`);
    let info = stmt.run(status, projectCode);
    console.log('updatePublicStatusSync info', info);
    resultDb.close();
}
module.exports = updatePublicStatusSync;