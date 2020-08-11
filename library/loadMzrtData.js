const sqlite3 = require('sqlite3').verbose();
/**
 * Get scan of next level one. Async mode.
 * @param {string} dir
 * @param {number} rt
 * @param {function} callback
 * @async
 */
function loadMzrtData(dir, minrt, maxrt, minmz, maxmz, callback) {
    let sql = `SELECT * FROM feature
                WHERE rt_high <= ? 
                AND rt_low >= ?
                AND mz_high <= ?
                AND mz_low >= ?
                ORDER BY INTENSITY DESC
                LIMIT 500;`;     
    /*let sql = `SELECT * FROM feature
                WHERE (mz_low <= ? AND rt_low <= ?)
                OR (mz_low <= ? AND rt_high >= ?)
                OR (mz_high >= ? AND rt_low <= ?)
                OR (mz_high >= ? AND rt_high >= ?);`;    */   
    let dbDir = dir;
    let resultDb = new sqlite3.Database(dbDir, (err) => {
        if (err) {
            console.error("error during db generation", err.message);
        }
       // console.log('Connected to the result database.');
    });

    resultDb.all(sql, [maxrt, minrt, maxmz, minmz], (err, row) => {
    //resultDb.all(sql, [maxmz, maxrt, maxmz, minrt, minmz, maxrt, minmz, minrt], (err, row) => {
        if (err) {
            console.error(err.message);
        }
        return callback(null, row);
    });
    resultDb.close();
}
module.exports = loadMzrtData;
