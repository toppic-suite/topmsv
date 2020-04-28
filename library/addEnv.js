const sqlite3 = require('sqlite3').verbose();

/**
 * Add a new envelope into database. Async mode.
 * @param {string} dir
 * @param {number} envID
 * @param {number} scan
 * @param {number} charge
 * @param {number} monoMass
 * @param {number} theoInteSum
 * @param {function} callback
 * @async
 */
function addEnv(dir, envID, scan, charge, monoMass,theoInteSum,callback) {
    let sql = `INSERT INTO envelope(envelope_id, scan_id, charge, mono_mass, intensity)
                VALUES(?,?,?,?,?);`;
    let dbDir = dir.substr(0, dir.lastIndexOf(".")) + ".db";
    let resultDb = new sqlite3.Database(dbDir, (err) => {
        if (err) {
            console.error(err.message);
        }
        // console.log('Connected to the result database.');
    });
    resultDb.run(sql,[envID,scan,charge,monoMass,theoInteSum], function(err) {
        if (err) {
            return console.error(err.message);
        }
        //console.log(this);
        console.log(`Row(s) added: ${this.changes}`);
        return callback();
    });
    resultDb.close();
}
module.exports = addEnv;