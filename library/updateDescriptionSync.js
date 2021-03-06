var BetterDB = require("better-sqlite3");
/**
 * Update project description by given projectCode. Sync mode.
 * @param {string} description - Project description to be updated
 * @param {string} projectCode - Project code
 */

function updateDescriptionSync(description, projectCode) {
    const resultDb = new BetterDB('./db/projectDB.db');
    let stmt = resultDb.prepare(`UPDATE Projects
                SET Description = ?
                WHERE ProjectCode = ?`);
    let info = stmt.run(description, projectCode);
    console.log('updateDescriptionSync info', info);
    resultDb.close();
}
module.exports = updateDescriptionSync;