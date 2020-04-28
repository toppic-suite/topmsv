const BetterDB = require("better-sqlite3");
/**
 * Delete single envelope information by envelope_id. Sync mode.
 * @param {string} dir
 * @param {number} envID
 * @param {function} callback
 */
function deleteSingleEnv(dir, envID, callback) {
    let dbDir = dir.substr(0, dir.lastIndexOf(".")) + ".db";
    let resultDb = new BetterDB(dbDir);

    let stmt = resultDb.prepare(`DELETE FROM envelope WHERE envelope_id = ?`);
    stmt.run(envID);
    resultDb.close();
    return callback();
}
module.exports = deleteSingleEnv;