const getPeakListByScanID = require("./getPeakListByScanID");
const getEnvPeakMax = require("./getEnvPeakMax");
const molecularFormulae = require('../distribution_calc/molecular_formulae');
const calcDistribution = new molecularFormulae();
const BetterDB = require('better-sqlite3');

/**
 * Calculate distribution by envelope information and add envelope peaks into database. Async mode.
 * @param {string} dir - Project directory
 * @param {number} charge - Charge
 * @param {number} theo_mono_mass - Theoretical mono mass
 * @param {number} scan_id - Scan ID
 * @param {number} envelope_id - Envelope ID
 * @param {function} callback - The callback function that handles request
 * @returns {function} Callback function
 * @async
 */
module.exports = function addEnvPeak(dir, charge, theo_mono_mass, scan_id, envelope_id, callback) {
    getPeakListByScanID(dir,scan_id,function (rows) {
        //console.log(rows);
        let peakList = calcDistribution.emass(theo_mono_mass,charge,rows);
        if(!peakList) {
            return callback(1);
        }
        //console.log(peakList);
        getEnvPeakMax(dir,function (maxID) {
            let envPeakID = maxID + 1;

            let dbDir = dir.substr(0, dir.lastIndexOf(".")) + ".db";
            let resultDb = new BetterDB(dbDir);

            let stmt = resultDb.prepare(`INSERT INTO env_peak(env_peak_id, envelope_id, mz, intensity)
                VALUES(?,?,?,?)`);
            let insertMany = resultDb.transaction((peakList,envPeakID) => {
                peakList.forEach(peak => {
                    stmt.run(envPeakID,envelope_id,peak.mz,peak.intensity);
                    envPeakID++;
                })
            });
            insertMany(peakList,envPeakID);
            resultDb.close();
            return callback(0);
        })
    })
}

// module.exports = {addEnvPeak};