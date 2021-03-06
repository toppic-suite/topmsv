const sqlite3 = require('sqlite3').verbose();

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
    let resultDb = new sqlite3.Database(dbDir, (err) => {
        if (err) {

            console.error(err.message);
        }
        // console.log('Connected to the result database.');
    });
    resultDb.run(sql,[charge, monoMass,theoInteSum,envID], function(err) {
        if (err) {
            return console.error(err.message);
        }
        resultDb.run(sqlDelete,[envID], function (err) {
            //console.log(this);
            console.log(`Row(s) edited: ${this.changes}`);
            return callback();
        });
    });
    resultDb.close();
}
module.exports = editEnv;