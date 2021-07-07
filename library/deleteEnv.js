const BetterDB = require('better-sqlite3'); 

/**
 * Delete envelope data by envelope_id. 
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
    let db = new BetterDB(dbDir);

    let stmt = db.prepare(sql);
    let info = stmt.run(envID);
    db.close();

    console.log(`Row(s) deleted: ${info.changes}`);
    return callback();
}
module.exports = deleteEnv;