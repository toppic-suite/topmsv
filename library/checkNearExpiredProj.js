"use strict";
const BetterDB = require('better-sqlite3');
/**
 * Get all about-to-expire projects in database, which were uploaded more than 29 days ago. Async mode.
 * @param {function} callback - Callback function that handles query results
 * @returns {function} callback function
 * @async
 */
function checkNearExpiredProj(callback) {
    let db = new BetterDB('./db/projectDB.db');
    let sql = `SELECT projectCode AS pcode,
            ProjectName AS projectName,
            FileName AS fileName,
            Email AS email
            FROM Projects
            WHERE datetime(Date, 'localtime') <= datetime('now', '-29 day', 'localtime') 
            AND ProjectStatus <> 3
            AND doesExpire = 'true'`;
    let stmt = db.prepare(sql);
    let rows = stmt.all();
    db.close();
    return callback(null, rows);
}
module.exports = checkNearExpiredProj;
