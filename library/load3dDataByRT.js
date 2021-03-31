const sqlite3 = require('sqlite3').verbose();
/**
 * Get scan of next level one. Async mode.
 * @param {string} dir
 * @param {number} scanNum
 * @param {function} callback
 * @async
 */
function load3dDataByRT(dir, rt, tableNum, minmz, maxmz, callback) {
    let sql = `SELECT *
                FROM PEAKS` + tableNum + 
                ` WHERE RETENTIONTIME = ?
                AND MZ >= ?
                AND MZ <= ?;`;

    let dbDir = dir;
    let resultDb = new sqlite3.Database(dbDir, (err) => {
        if (err) {
            console.error("error during db generation", err.message);
        }
        // console.log('Connected to the result database.');
    });
    
    resultDb.all(sql, [rt, minmz, maxmz], (err, row) => {
        if (err) {
            console.error(err.message);
        }
        return callback(null, row);
    });
    resultDb.close();
}
module.exports = load3dDataByRT;