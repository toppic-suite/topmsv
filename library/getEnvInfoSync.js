const BetterDB = require("better-sqlite3");

/**
 * Get envelope's mono_mass and charge by given envelope ID. Sync mode.
 * @param {string} dir - Project directory
 * @param {number} envID - Envelope ID
 * @return {object} Envelope mono mass and charge
 */
function getEnvInfoSync(dir, envID) {
    let dbDir = dir.substr(0, dir.lastIndexOf(".")) + ".db";
    let resultDb = new BetterDB(dbDir);
    let stmt = resultDb.prepare(`SELECT mono_mass AS mono_mass, charge AS charge
                FROM envelope
                WHERE envelope_id = ?`);
    let queryResult = stmt.get(envID);
    resultDb.close();
    return queryResult;
}

module.exports = getEnvInfoSync;