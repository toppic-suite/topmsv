const sqlite3 = require('sqlite3').verbose();
/**
 * Get a list of all peaks by given scan. Async mode.
 *
 * @param {string} dir - Project directory
 * @param {number} scan - Scan number
 * @param {function} callback - Callback function that handles query results
 * @returns {function} Callback function
 * 
 * @async
 */
function getPeakList(dir, scan, callback) {
    let sql = `SELECT MZ AS mz,
                  INTENSITY AS intensity
           FROM PEAKS INNER JOIN SPECTRA ON PEAKS.SPECTRAID=SPECTRA.ID
           WHERE SCAN = ?`;
    //ORDER BY INTENSITY DESC`;
    //LIMIT 1000`;
    let dbDir = dir.substr(0, dir.lastIndexOf(".")) + ".db";
    let resultDb = new sqlite3.Database(dbDir, (err) => {
        if (err) {
            console.error(err.message);
        }
        //console.log('Connected to the result database.' + dbDir);
    });
    resultDb.all(sql, [scan], (err, rows) => {
        if (err) {
            throw err;
        }
        return callback(null, rows);
        //console.log(`${row.MZ} - ${row.INTENSITY}`);
        // var data = JSON.stringify(rows);
        // fs.writeFileSync('result.json', data);
    });
    resultDb.close();
}
module.exports = getPeakList;