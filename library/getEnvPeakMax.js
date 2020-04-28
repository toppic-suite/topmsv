const sqlite3 = require('sqlite3').verbose();
/**
 * Get maximum id of envelope peaks. Async mode.
 *
 * @param {string} dir
 * @param {function} callback
 * @async
 */
module.exports = function getEnvPeakMax(dir,callback) {
    let sql = `SELECT MAX(env_peak_id) AS maxID
                FROM env_peak`;
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
//module.exports = getEnvPeakMax;