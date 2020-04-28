const sqlite3 = require('sqlite3').verbose();
/**
 * Insert new project into database. Async mode.
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
 * @async
 * @deprecated
 */
function insertRow(ProjectCode, ProjectName, FileName, Description, ProjectDir, ProjectStatus, Email, EnvStatus, SeqStatus, ms1EnvFile,uid,publicStatus) {
    let db = new sqlite3.Database('./db/projectDB.db', (err) => {
        if (err) {
            console.error(err.message);
        }
        // console.log('Connected to the result database.');
    });
    let sql = 'INSERT INTO Projects(ProjectCode, ProjectName, FileName, Description, ProjectDir, ProjectStatus, Email, EnvelopeStatus, SequenceStatus, MS1_envelope_file, uid, public) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)';
    db.run(sql, [ProjectCode,ProjectName,FileName,Description,ProjectDir,ProjectStatus,Email,EnvStatus,SeqStatus,ms1EnvFile,uid,publicStatus], function(err) {
        if (err) {
            return console.log(err.message);
        }
        // get the last insert id
        console.log(`A row has been inserted with rowid ${this.lastID}`);
    });
    db.close();
}
module.exports = insertRow;