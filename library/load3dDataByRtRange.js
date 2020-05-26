const sqlite3 = require('sqlite3').verbose();
/**
 * Get scan of next level one. Async mode.
 * @param {string} dir
 * @param {number} rt
 * @param {function} callback
 * @async
 */
function load3dDataByRtRange(dir, minrt, maxrt, callback) {
    let sql = `SELECT *
                FROM PEAKS
                WHERE RETENTIONTIME <= ? 
                AND RETENTIONTIME >= ?;`;
    let dbDir = dir;
    let resultDb = new sqlite3.Database(dbDir, (err) => {
        if (err) {
            console.error("error during db generation", err.message);
        }
        // console.log('Connected to the result database.');
    });
    
    resultDb.all(sql, [maxrt, minrt], (err, row) => {
        if (err) {
            console.error(err.message);
        }
        return callback(null, row);
    });
    resultDb.close();
}
module.exports = load3dDataByRtRange;