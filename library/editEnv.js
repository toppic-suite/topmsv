"use strict";
const BetterDB = require('better-sqlite3');
/**
 * Edit envelope data by envelope_id. Delete previous corresponding envelope peaks first. Async mode.
 * @param {string} dir - Project directory
 * @param {number} envID - Envelope ID
 * @param {number} charge - Charge
 * @param {number} monoMass - Mono mass
 * @param {number} theoInteSum - Theoretical intensity sum
 * @param {function} callback - Callback function that handles query results
 * @returns {function} callback function
 * @async
 */
function editEnv(dir, envID, charge, monoMass, theoInteSum, callback) {
    let sql = `UPDATE envelope
                SET charge = ?,
                mono_mass = ?,
                intensity = ?
                WHERE envelope_id = ?;`;
    let sqlDelete = `DELETE FROM env_peak WHERE envelope_id = ?`;
    let dbDir = dir.substr(0, dir.lastIndexOf(".")) + ".db";
    let db = new BetterDB(dbDir);
    let stmtForUpdate = db.prepare(sql);
    let stmtForDelete = db.prepare(sqlDelete);
    let infoForUpdate = stmtForUpdate.run(charge, monoMass, theoInteSum, envID);
    let infoForDelete = stmtForDelete.run(envID);
    console.log(`Row(s) edited: ${infoForDelete.changes}`);
    db.close();
    return callback();
}
module.exports = editEnv;
