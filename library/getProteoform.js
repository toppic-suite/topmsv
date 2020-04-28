const BetterDB = require("better-sqlite3");
/**
 * Get proteoform by given scan. Sync mode.
 *
 * @param {string} dir
 * @param {number} scanNum
 */
function getProteoform(dir, scanNum) {
    let dbDir = dir.substr(0, dir.lastIndexOf(".")) + ".db";
    let resultDb = new BetterDB(dbDir);
    let stmt = resultDb.prepare(`SELECT sequence.proteoform AS proteoform
                FROM SPECTRA INNER JOIN sequence ON SPECTRA.ID = sequence.scan_id
                WHERE SPECTRA.SCAN = ?`);
    if(stmt.get(scanNum)) {
        let proteoform = stmt.get(scanNum).proteoform;
        resultDb.close();
        return proteoform;
    } else {
        resultDb.close();
        return 0;
    }
}
module.exports = getProteoform;