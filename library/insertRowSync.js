const BetterDB = require("better-sqlite3");
/**
 * Insert new project information into database. Sync mode.
 * @param {string} ProjectCode
 * @param {string} ProjectName
 * @param {string} FileName
 * @param {string} Description
 * @param {string} ProjectDir
 * @param {number} ProjectStatus
 * @param {string} Email
 * @param {number} EnvStatus
 * @param {number} SeqStatus
 * @param {string} ms1EnvFile
 * @param {string} uid
 * @param {number} publicStatus
 */
function insertRowSync(ProjectCode, ProjectName, FileName, Description, ProjectDir, ProjectStatus, Email, EnvStatus, SeqStatus, ms1EnvFile,uid,publicStatus) {
    let resultDb = new BetterDB('./db/projectDB.db');
    let stmt = resultDb.prepare('INSERT INTO Projects(ProjectCode, ProjectName, FileName, Description, ProjectDir, ProjectStatus, Email, EnvelopeStatus, SequenceStatus, MS1_envelope_file, uid, public) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)');
    let info = stmt.run(ProjectCode, ProjectName, FileName, Description, ProjectDir, ProjectStatus, Email, EnvStatus, SeqStatus, ms1EnvFile,uid, publicStatus);
    console.log("insertRowSync info", info);
    resultDb.close();
}
module.exports = insertRowSync;