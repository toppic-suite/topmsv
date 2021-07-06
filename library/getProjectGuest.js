const BetterDB = require('better-sqlite3'); 
/**
 * Get all successful public projects. 
 * @param {function} callback - Callback function that handles query results
 * @returns {function} Callback function
 * @async
 */
function getProjectsGuest(callback) {
    let db = new BetterDB("./db/projectDB.db");

    let sql = `SELECT ProjectName AS projectName, ProjectCode AS projectCode, FileName AS fileName, ProjectStatus AS projectStatus, EnvelopeStatus AS envStatus, FeatureStatus AS featureStatus, SequenceStatus AS seqStatus, Description AS description, datetime(Date, 'localtime') AS uploadTime, MS1_envelope_file AS envelopeFile
                FROM Projects
                WHERE ProjectStatus = 1 AND public = 'true'`;
    let stmt = db.prepare(sql);
    let rows = stmt.all();

    db.close();
    return callback(rows);
}
module.exports = getProjectsGuest;