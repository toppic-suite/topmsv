const sqlite3 = require('sqlite3').verbose();
/**
 * Get all information of one envelope by given envelope_id. Async mode.
 *
 * @param {string} dir - Project directory
 * @param {number} envID - Envelope ID
 * @param {function} callback - Callback function that handles query results
 * @returns {function} Callback function
 * @async
 */
function getEnv(dir, envID,callback) {
    let sql = `SELECT *
                FROM envelope
                WHERE envelope_id = ?;`;
    let dbDir = dir.substr(0, dir.lastIndexOf(".")) + ".db";
    let resultDb = new sqlite3.Database(dbDir, (err) => {
        if (err) {
            console.error(err.message);
        }
        // console.log('Connected to the result database.');
    });
    resultDb.get(sql,envID, (err,row) => {
        if (err) {
            return console.error(err.message);
        }
        return callback(row);
    });
    resultDb.close();
}
module.exports = getEnv;