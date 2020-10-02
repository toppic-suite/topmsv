const sqlite3 = require('sqlite3').verbose();
/**
 * Get scan of next level one. Async mode.
 * @param {string} dir - Project directory
 * @param {number} rt - Retention time
 * @param {function} callback - Callback function that handles query results
 * @returns {function} Callback function
 * @async
 */
function loadMzrtData(dir, minrt, maxrt, minmz, maxmz, callback) {
   let sql = `SELECT * FROM feature
              WHERE NOT (rt_low >= ? OR rt_high <= ? OR mz_low >= ? OR mz_high <= ?)
              LIMIT 500;`;          
    let dbDir = dir;

    
    let resultDb = new sqlite3.Database(dbDir, (err) => {
        if (err) {
            console.error("error during db generation", err.message);
        }
       // console.log('Connected to the result database.');
    });

    resultDb.all(sql, [maxrt, minrt, maxmz, minmz], (err, row) => {
        if (err) {
            console.error(err.message);
        }
        return callback(null, row);
    });
    resultDb.close();
}
module.exports = loadMzrtData;
