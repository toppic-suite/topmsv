const sqlite3 = require('sqlite3').verbose();
/**
 * Get scan of next level one. Async mode.
 * @param {string} dir
 * @param {number} scanNum
 * @param {function} callback
 * @async
 */
function load3dDataByScan(dir, scan, callback) {
    let sql = `SELECT *
                FROM PEAKS
                WHERE SPECTRAID = ? 
                ORDER BY INTENSITY DESC;`;
    let dbDir = dir;
    let resultDb = new sqlite3.Database(dbDir, (err) => {
        if (err) {
            console.error("error during db generation", err.message);
        }
        // console.log('Connected to the result database.');
    });
    
    resultDb.all(sql, [scan], (err, row) => {
        if (err) {
            console.error(err.message);
        }
        return callback(null, row);
    });
    resultDb.close();
}
module.exports = load3dDataByScan;