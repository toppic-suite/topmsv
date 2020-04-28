const sqlite3 = require('sqlite3').verbose();

/**
 * Get maximum id of envelopes. Async mode.
 *
 * @param {string} dir
 * @param {function} callback
 * @async
 */

function getEnvMax(dir, callback){
    let sql = `SELECT MAX(envelope_id) AS maxID
                FROM envelope`;
    let dbDir = dir.substr(0, dir.lastIndexOf(".")) + ".db";
    let resultDb = new sqlite3.Database(dbDir, (err) => {
        if (err) {
            console.error(err.message);
        }
        // console.log('Connected to the result database.');
    });
    resultDb.get(sql,(err,row) => {
        if (err) {
            return console.error(err.message);
        }
        //console.log(this);
        // console.log(`Row(s) edited: ${this.changes}`);
        return callback(row.maxID);
    });
    resultDb.close();
}
module.exports = getEnvMax;