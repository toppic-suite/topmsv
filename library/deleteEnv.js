const sqlite3 = require('sqlite3').verbose();

/**
 * Delete envelope data by envelope_id. Async Mode.
 * @param {string} dir - Project directory
 * @param {number} envID - Envelope ID
 * @param {function} callback - Callback function that handles query results.
 * @returns {function} callback function
 * @async
 */
function deleteEnv(dir, envID, callback) {
    let sql = `DELETE FROM envelope
                WHERE envelope_id = ?`;
    let dbDir = dir.substr(0, dir.lastIndexOf(".")) + ".db";
    let resultDb = new sqlite3.Database(dbDir, (err) => {
        if (err) {
            console.error(err.message);
        }
        // console.log('Connected to the result database.');
    });
    resultDb.run(sql,[envID], function(err) {
        if (err) {
            return console.error(err.message);
        }
        console.log(`Row(s) deleted: ${this.changes}`);
        return callback();
    });
    resultDb.close();
}
module.exports = deleteEnv;