const BetterDB = require('better-sqlite3'); 

/**
 * Add a new envelope into database. Async mode.
 * @param {string} dir - Project directory
 * @param {number} envID - Envelope ID
 * @param {number} scan - Scan ID
 * @param {number} charge - Charge
 * @param {number} monoMass - Mono mass
 * @param {number} theoInteSum -Theoretical intensity sum
 * @param {function} callback - The callback that handles the response
 * @async
 */
function addEnv(dir, envID, scan, charge, monoMass,theoInteSum,callback) {
    let dbDir = dir.substr(0, dir.lastIndexOf(".")) + ".db";
    let resultDb = new BetterDB(dbDir);
    let stmt = resultDb.prepare(`INSERT INTO envelope(envelope_id, scan_id, charge, mono_mass, intensity)
    VALUES(?,?,?,?,?)`);

    let info = stmt.run(envID,scan,charge,monoMass,theoInteSum);

    resultDb.close();
    console.log(`Row(s) added: ${info.changes}`);
    return callback();
}
module.exports = addEnv;