const sqlite3 = require('sqlite3').verbose();
/**
 * Get all envelope information of one scan by scanID. Async mode.
 * @param {string} dir
 * @param {number} scanID
 * @param {function} callback
 * @async
 */
function getEnvTable(dir, scanID, callback){
    let sql = `SELECT envelope_id,scan_id, charge, mono_mass, intensity
                FROM envelope
                WHERE scan_id = ?`;
    let dbDir = dir.substr(0, dir.lastIndexOf(".")) + ".db";
    let resultDb = new sqlite3.Database(dbDir, (err) => {
        if (err) {
            console.error(err.message);
        }
        // console.log('Connected to the result database.');
    });
    resultDb.all(sql,[scanID], (err, rows) => {
        if (err) {
            console.error(err.message);
        }
        //console.log(row);
        return callback(null, rows);
    });
    resultDb.close();
}
module.exports = getEnvTable;