"use strict";
const BetterDB = require("better-sqlite3");
/**
 * Get all projects of one user, which is not in waiting status.
 * @param {number} uid - User ID
 * @param {function} callback - Callback function that handles query results
 * @returns {function} Callback function
 */
function getProjects(uid, callback) {
    let db = new BetterDB("./db/projectDB.db");
    let sql = `SELECT ProjectName AS projectName, ProjectCode AS projectCode, FileName AS fileName, ProjectStatus AS projectStatus, EnvelopeStatus AS envStatus, FeatureStatus AS featureStatus, SequenceStatus AS seqStatus, Description AS description, datetime(Date, 'localtime') AS uploadTime, MS1_envelope_file AS envelopeFile
                FROM Projects
                WHERE (ProjectStatus = 1 OR ProjectStatus = 0 OR ProjectStatus = 2) AND uid = ?;`;
    let stmt = db.prepare(sql);
    let rows = stmt.all(uid);
    db.close();
    return callback(rows);
}
module.exports = getProjects;
