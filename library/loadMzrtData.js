const BetterDB = require('better-sqlite3'); 
/**
 * Get scan of next level one. 
 * @param {string} dir - Project directory
 * @param {number} minrt - minimum retention time
 * @param {number} maxrt - maximum retention time
 * @param {number} minmz - minimum m/z
 * @param {number} maxmz - maximum m/z
 * @param {number} limit - maximum peak data to return
 * @param {function} callback - Callback function that handles query results
 * @returns {function} Callback function
 */
function loadMzrtData(dir, minrt, maxrt, minmz, maxmz, limit, callback) {
    let dbDir = dir;
    let db = new BetterDB(dbDir);

    if (limit == "ALL") {
        let sql = `SELECT * FROM feature
              WHERE NOT (rt_low >= ? OR rt_high <= ? OR mz_low >= ? OR mz_high <= ?);`; 

        let stmt = db.prepare(sql);
        let rows = stmt.all(maxrt, minrt, maxmz, minmz);
        db.close();
        return callback(null, rows);
    }
    else{
        let sql = `SELECT * FROM feature
            WHERE NOT (rt_low >= ? OR rt_high <= ? OR mz_low >= ? OR mz_high <= ?)
            LIMIT ?;`;  

        let stmt = db.prepare(sql);
        let rows = stmt.all(maxrt, minrt, maxmz, minmz, limit);
        db.close();
        return callback(null, rows);
    }
}
module.exports = loadMzrtData;
