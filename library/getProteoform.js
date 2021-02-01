const BetterDB = require("better-sqlite3");
/**
 * Get proteoform by given scan. Sync mode.
 * @param {string} dir - Project directory
 * @param {number} scanNum - Scan number
 * @returns {Object} Object contains proteoform
 */
function getProteoform(dir, scanNum) {
    let dbDir = dir.substr(0, dir.lastIndexOf(".")) + ".db";
    let resultDb = new BetterDB(dbDir);
    /*let stmt = resultDb.prepare(`SELECT sequence.proteoform AS proteoform
                FROM SPECTRA INNER JOIN sequence ON SPECTRA.ID = sequence.scan_id
                WHERE SPECTRA.SCAN = ?`);*/
    let stmt = resultDb.prepare(`SELECT sequence.proteoform AS proteoform, sequence.spec_fdr AS spec_fdr, sequence.prot_fdr AS prot_fdr
                FROM SPECTRA INNER JOIN sequence ON SPECTRA.ID = sequence.scan_id
                WHERE SPECTRA.SCAN = ?`);
    if(stmt.get(scanNum)) {
        let proteoform = stmt.get(scanNum).proteoform;
        let specFDR = stmt.get(scanNum).spec_fdr;
        let protFDR = stmt.get(scanNum).prot_fdr;
        resultDb.close();
        return {"seq":proteoform,"specFDR":specFDR, "protFDR":protFDR};
        //return proteoform;
    } else {
        resultDb.close();
        return 0;
    }
}
module.exports = getProteoform;