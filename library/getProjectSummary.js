const BetterDB = require('better-sqlite3'); 

/**
 * Get project information summary by projectCode. Async Mode.
 * @param {string} id - Project code
 * @param {function} callback - Callback function that handles query results
 * @async
 */
function getProjectSummary(id, callback) {
    let db = new BetterDB('./db/projectDB.db');
    let sql = `SELECT ProjectName AS projectName,
                    ProjectStatus AS projectStatus,
                    Email AS email,
                    ProjectDir AS projectDir,
                    FileName AS fileName,
                    EnvelopeStatus AS envelopeStatus,
					FeatureStatus AS featureStatus,
                    SequenceStatus AS sequenceStatus,
                    MS1_envelope_file AS ms1_envelope_file,
                    uid AS uid,
                    public AS public,
                    Description AS description
                FROM Projects
                WHERE ProjectCode = ?`;
    
    let stmt = db.prepare(sql);
    let rows = stmt.all(id);

    db.close();
    return callback(null, rows);
}
module.exports = getProjectSummary;