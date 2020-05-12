const BetterDB = require("better-sqlite3");

/**
 * Get envelope peaks by given envelopeID. Sync Mode.
 * @param {string} dir
 * @param {number} envID
 * @return {array} result
 */
function getEnvPeakListSync(dir, envID) {
    let dbDir = dir.substr(0, dir.lastIndexOf(".")) + ".db";
    let resultDb = new BetterDB(dbDir);
    let stmt = resultDb.prepare(`SELECT mz, intensity
                FROM env_peak
                WHERE envelope_id = ?`);
    let queryResult = stmt.all(envID);
    resultDb.close();
    return queryResult;
}

module.exports = getEnvPeakListSync;