const sqlite3 = require('sqlite3').verbose();
/**
 * Get scan of next level one. Async mode.
 * @param {string} dir - Project directory
 * @param {number} minrt - minimum retention time
 * @param {number} maxrt - maximum retention time
 * @param {number} minmz - minimum m/z
 * @param {number} maxmz - maximum m/z
 * @param {number} limit - maximum peak data to return
 * @param {function} callback - Callback function that handles query results
 * @returns {function} Callback function
 * @async
 */
function loadMzrtData(dir, minrt, maxrt, minmz, maxmz, limit, callback) {
    let dbDir = dir;
    let resultDb = new sqlite3.Database(dbDir, (err) => {
        if (err) {
            console.log("dir", dir);
            console.error("error during db generation", err.message);
        }
       // console.log('Connected to the result database.');
    });       
    if (limit == "ALL") {
        let sql = `SELECT * FROM feature
              WHERE NOT (rt_low >= ? OR rt_high <= ? OR mz_low >= ? OR mz_high <= ?);`; 

        resultDb.all(sql, [maxrt, minrt, maxmz, minmz], (err, row) => {
            if (err) {
                console.error(err.message);
            }
            return callback(null, row);
        }); 
    }
    else{
        let sql = `SELECT * FROM feature
            WHERE NOT (rt_low >= ? OR rt_high <= ? OR mz_low >= ? OR mz_high <= ?)
            LIMIT ?;`;  

        resultDb.all(sql, [maxrt, minrt, maxmz, minmz, limit], (err, row) => {
            if (err) {
                console.error(err.message);
            }
            return callback(null, row);
        });
    }
    resultDb.close();
}
module.exports = loadMzrtData;
