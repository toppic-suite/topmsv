const sqlite3 = require('sqlite3').verbose();
/**
 * Get all projects of one user, which is not in waiting status. Async mode.
 * @param {string} uid
 * @param {function} callback
 * @async
 */
function getProjects(uid,callback) {
    let db = new sqlite3.Database("./db/projectDB.db", (err) => {
        if (err) {
            console.error(err.message);
        }
        // console.log('Connected to the result database.');
    });
    let sql = `SELECT ProjectName AS projectName, ProjectCode AS projectCode, FileName AS fileName, ProjectStatus AS projectStatus, EnvelopeStatus AS envStatus, SequenceStatus AS seqStatus, Description AS description, datetime(Date, 'localtime') AS uploadTime, MS1_envelope_file AS envelopeFile
                FROM Projects
                WHERE (ProjectStatus = 1 OR ProjectStatus = 0 OR ProjectStatus = 2) AND uid = ?;`;
    db.all(sql,[uid], (err, rows) => {
        if(err) {
            return callback(err);
        }else {
            return callback(rows);
        }
    });
    db.close();
}

module.exports = getProjects;