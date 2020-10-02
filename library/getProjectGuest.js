const sqlite3 = require('sqlite3').verbose();
/**
 * Get all successful public projects. Async mode.
 * @param {function} callback - Callback function that handles query results
 * @returns {function} Callback function
 * @async
 */
function getProjectsGuest(callback) {
    let db = new sqlite3.Database("./db/projectDB.db", (err) => {
        if (err) {
            console.error(err.message);
        }
        // console.log('Connected to the result database.');
    });
    let sql = `SELECT ProjectName AS projectName, ProjectCode AS projectCode, FileName AS fileName, ProjectStatus AS projectStatus, EnvelopeStatus AS envStatus, SequenceStatus AS seqStatus, Description AS description, datetime(Date, 'localtime') AS uploadTime, MS1_envelope_file AS envelopeFile
                FROM Projects
                WHERE ProjectStatus = 1 AND public = 'true'`;
    db.all(sql,[], (err, rows) => {
        if(err) {
            return callback(err);
        }else {
            return callback(rows);
        }
    });
    db.close();
}
module.exports = getProjectsGuest;