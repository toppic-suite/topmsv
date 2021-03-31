const BetterDB = require("better-sqlite3");
/**
 * Update proteoform of sequence table by scan. Sync Mode.
 * @param {string} projectDir - Project directory
 * @param {string} proteoform - Proteoform sequence
 * @param {number} scan - Scan number
 */
function updateSequence(projectDir, proteoform, scan) {
    let dbDir = projectDir.substr(0, projectDir.lastIndexOf(".")) + ".db";
    let resultDb = new BetterDB(dbDir);
    let stmt = resultDb.prepare(`UPDATE sequence
                                SET proteoform = ?
                                WHERE scan_id IN (SELECT ID FROM SPECTRA WHERE SCAN = ?);`);
    let info = stmt.run(proteoform, scan);
    console.log("updateSeq info", info.changes);
    resultDb.close();
}

module.exports = updateSequence;