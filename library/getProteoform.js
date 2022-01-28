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
    let stmt = resultDb.prepare(`SELECT sequence.proteoform AS proteoform, sequence.prec_mass AS prec_mass, sequence.e_value AS e_value, sequence.q_value AS q_value
                FROM SPECTRA INNER JOIN sequence ON SPECTRA.SCAN = sequence.scan_id
                WHERE SPECTRA.SCAN = ?`);
    if(stmt.get(scanNum)) {
        let proteoform = stmt.get(scanNum).proteoform;
        let prec_mass = stmt.get(scanNum).prec_mass;
        let qVal = stmt.get(scanNum).q_value;
        let eVal = stmt.get(scanNum).e_value;

        //format qVal and eVal
        if (qVal != "N/A"){
            qVal = (parseFloat(qVal).toExponential(2)).toString();
        }
        if (eVal != "N/A"){
            eVal = (parseFloat(eVal).toExponential(2)).toString();
        }   
        resultDb.close();
        //console.log({"seq":proteoform,"q_value":qVal, "e_value":eVal});
        return {"seq":proteoform, "prec_mass":prec_mass, "q_value":qVal, "e_value":eVal};
        //return proteoform;
    } else {
        resultDb.close();
        return 0;
    }
}
module.exports = getProteoform;