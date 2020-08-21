const BetterDB = require("better-sqlite3");

/**
 * Get a list of Envelope ID, whose Mz value is between min and max. Async mode.
 * @param {string} dir
 * @param {number} min
 * @param {number} max
 * @param {number} scan
 * @return {array} EnvelopeIDList
 * @async
 */
function getEnvIDListByMZRange(dir, min, max, scan) {
    let dbDir = dir.substr(0, dir.lastIndexOf(".")) + ".db";
    let resultDB = new BetterDB(dbDir);
    let stmt = resultDB.prepare('SELECT DISTINCT envelope.envelope_id ' +
        'FROM env_peak INNER JOIN envelope ON env_peak.envelope_id = envelope.envelope_id ' +
        'INNER JOIN SPECTRA ON envelope.scan_id = SPECTRA.ID ' +
        'WHERE SPECTRA.SCAN = ? AND env_peak.mz >= ? AND env_peak.mz <= ?;');
    let envIDList = stmt.all(scan, min, max);
    resultDB.close();
    return envIDList;
}

module.exports = getEnvIDListByMZRange;