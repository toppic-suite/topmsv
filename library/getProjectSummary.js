const sqlite3 = require('sqlite3').verbose();

/**
 * Get project information summary by projectCode. Async Mode.
 * @param {string} id
 * @param {function} callback
 */
function getProjectSummary(id, callback) {
    let db = new sqlite3.Database('./db/projectDB.db', (err) => {
        if (err) {
            console.error(err.message);
        }
        // console.log('Connected to the result database.');
    });
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
    db.get(sql, [id], (err, row) => {
        if (err) {
            return callback(err);
        }
        else {
            //console.log(row);
            return callback(null, row);
        }
    });
    db.close();
}
module.exports = getProjectSummary;