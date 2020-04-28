const sqlite3 = require('sqlite3').verbose();
/**
 * Get a list of corresponding peaks by given scanID. Async mode.
 * @param {string} dir
 * @param {number} scan_id
 * @param {function} callback
 * @async
 */
module.exports = function getPeakListByScanID(dir,scan_id,callback) {
    let sql = `SELECT MZ AS mz,
                INTENSITY AS intensity
                FROM PEAKS
                WHERE SPECTRAID = ?;`;
    let dbDir = dir.substr(0, dir.lastIndexOf(".")) + ".db";
    let resultDb = new sqlite3.Database(dbDir, (err) => {
        if (err) {
            console.error(err.message);
        }
        //console.log('Connected to the result database.' + dbDir);
    });
    resultDb.all(sql, [scan_id], (err, rows) => {
        if (err) {
            throw err;
        }
        return callback(rows);
    });
    resultDb.close();
}
// module.exports = {getPeakListByScanID};