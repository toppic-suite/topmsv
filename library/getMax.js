const sqlite3 = require('sqlite3').verbose();
/**
 * Get maximum and minimum mz and rt for this mzML file.
 * @param {string} dir - Project directory
 * @param {number} scanNum - Scan number
 * @param {function} callback - Callback function that handles query results.
 * @returns {function} Callback function
 * @async
 */
function getMax(dir, callback) {
    let sql = `SELECT * FROM CONFIG;`;
    let dbDir = dir;
    let resultDb = new sqlite3.Database(dbDir, (err) => {
        if (err) {
            console.error("error during db generation", err.message);
        }
        // console.log('Connected to the result database.');
    });
    resultDb.all(sql, (err, row) => {
        if (err) {
            console.error(err.message);
        }
        return callback(null, row);
    });
    resultDb.close();
}
module.exports = getMax;
