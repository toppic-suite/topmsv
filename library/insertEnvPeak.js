const betterDB = require("better-sqlite3");
/**
 * Insert envelope peaks by peak.mz and peak.intensity. Sync mode.
 * @param {string} dir - Project directory
 * @param {number} envPeakID - Envelope peak ID
 * @param {number} envID - Envelope ID
 * @param {number} mz - M/z value
 * @param {number} intensity - Intensity
 * @deprecated
 */
function insertEnvPeak(dir, envPeakID, envID, mz, intensity) {
    let dbDir = dir.substr(0, dir.lastIndexOf(".")) + ".db";
    let resultDb = new betterDB(dbDir);

    let stmt = resultDb.prepare(`INSERT INTO env_peak(env_peak_id, envelope_id, mz, intensity)
                VALUES(?,?,?,?)`);
    const insertMany = db.transaction((cats) => {
        for (const cat of cats) stmt.run(envPeakID,envelope_id,peak.mz,peak.intensity);
    });
    resultDb.run(sql,[envPeakID,envID,mz,intensity], function(err) {
        if (err) {
            return console.error(err.message);
        }
        //console.log(this);
        console.log(`Row(s) added: ${this.changes}`);
    });
    resultDb.close();
}
module.exports = insertEnvPeak;