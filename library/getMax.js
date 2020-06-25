const sqlite3 = require('sqlite3').verbose();
/**
 * Get maximum and minimum mz and rt for this mzML file.
 * @param {string} dir
 * @param {number} scanNum
 * @param {function} callback
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
    resultDb.get(sql, (err, row) => {
        if (err) {
            console.error(err.message);
        }
        console.log(row)
        return callback(null, row);
    });
    resultDb.close();
}
module.exports = getMax;