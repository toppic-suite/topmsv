const BetterDB = require('better-sqlite3');
const updateEnvStatusSync = require('./updateEnvStatusSync');
/**
 * Delete all envelope peaks data by projectCode. Sync mode.
 * @param {string} projectDir - Project directory
 * @param {string} projectCode - Prject Code
 */
function deleteEnvPeak(projectDir, projectCode) {
    let dbDir = projectDir.substr(0, projectDir.lastIndexOf(".")) + ".db";
    let resultDb = new BetterDB(dbDir);

    let stmt = resultDb.prepare(`DROP TABLE IF EXISTS env_peak;`);
    stmt.run();
    stmt = resultDb.prepare(`DROP TABLE IF EXISTS envelope;`);
    stmt.run();
    resultDb.close();
    updateEnvStatusSync(0, projectCode);
    /*updateEnvStatus(db,0,projectCode, function () {
        callback();
    });*/
}
module.exports = deleteEnvPeak;