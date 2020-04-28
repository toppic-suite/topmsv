const BetterDB = require("better-sqlite3");
/**
 * Get all sequence information of one project. Sync mode.
 * @param {string} dir
 */
function getAllSeq(dir) {
    let dbDir = dir.substr(0, dir.lastIndexOf(".")) + ".db";
    let resultDb = new BetterDB(dbDir);
    let stmt = resultDb.prepare(`SELECT SPECTRA.ID AS scanID, SPECTRA.SCAN AS scan, sequence.protein_accession AS protein_accession, sequence.proteoform AS proteoform
                                FROM sequence INNER JOIN SPECTRA ON sequence.scan_id = SPECTRA.ID`);
    if(stmt.all()) {
        let seqResult = stmt.all();
        resultDb.close();
        return seqResult;
    } else {
        resultDb.close();
        return 0;
    }
}
module.exports = getAllSeq;