const BetterDB = require('better-sqlite3');
const updateFeatureStatusSync = require('./updateFeatureStatusSync');
/**
 * Delete all feature data by projectCode. Sync mode.
 * @param {string} projectDir
 * @param {string} projectCode
 */
function deleteFeature(projectDir, projectCode) {
    let dbDir = projectDir.substr(0, projectDir.lastIndexOf(".")) + ".db";
    let resultDb = new BetterDB(dbDir);

    let stmt = resultDb.prepare(`DROP TABLE IF EXISTS env_feature;`);
    stmt.run();
    stmt = resultDb.prepare(`DROP TABLE IF EXISTS feature;`);
    stmt.run();
    resultDb.close();
    updateFeatureStatusSync(0, projectCode);
}
module.exports = deleteFeature;