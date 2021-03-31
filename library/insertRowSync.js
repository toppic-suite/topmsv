const BetterDB = require("better-sqlite3");
/**
 * Insert new project information into database. Sync mode.
 * @param {string} ProjectCode - Project code
 * @param {string} ProjectName - Project name
 * @param {string} FileName - File name
 * @param {string} Description - Project description
 * @param {string} ProjectDir - Project directory
 * @param {number} ProjectStatus - Project status code
 * @param {string} Email - User email
 * @param {number} EnvStatus - Envelope status code
 * @param {number} SeqStatus - Sequence status code
 * @param {string} ms1EnvFile - MS1 envelope file name
 * @param {number} uid - User ID
 * @param {number} publicStatus Public status code
 */
function insertRowSync(ProjectCode, ProjectName, FileName, Description, ProjectDir, ProjectStatus, Email, EnvStatus, FeatureStatus, SeqStatus, ms1EnvFile,uid,publicStatus) {
    let resultDb = new BetterDB('./db/projectDB.db');
    let stmt = resultDb.prepare('INSERT INTO Projects(ProjectCode, ProjectName, FileName, Description, ProjectDir, ProjectStatus, Email, EnvelopeStatus, FeatureStatus, SequenceStatus, MS1_envelope_file, uid, public) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)');
    let info = stmt.run(ProjectCode, ProjectName, FileName, Description, ProjectDir, ProjectStatus, Email, EnvStatus, FeatureStatus,SeqStatus, ms1EnvFile,uid, publicStatus);
    console.log("insertRowSync info", info);
    resultDb.close();
}
module.exports = insertRowSync;