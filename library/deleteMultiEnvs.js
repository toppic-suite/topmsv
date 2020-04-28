const BetterDB = require('better-sqlite3');
/**
 * Delete multiple envelopes by a list of envelope_id. Sync mode.
 * @param {string} dir
 * @param {array} envList
 * @param {function} callback
 */
function deleteMultiEnvs(dir, envList,callback) {
    let dbDir = dir.substr(0, dir.lastIndexOf(".")) + ".db";
    let resultDb = new BetterDB(dbDir);

    let stmt = resultDb.prepare(`DELETE FROM envelope WHERE envelope_id = ?`);
    let deleteMany = resultDb.transaction((envList) => {
        envList.forEach(env => {
            stmt.run(env.envelope_id);
        })
    });
    deleteMany(envList);
    resultDb.close();
    return callback();
}
module.exports = deleteMultiEnvs;