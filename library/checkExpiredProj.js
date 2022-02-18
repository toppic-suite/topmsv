"use strict";
const BetterDB = require('better-sqlite3');
/**
 * Get all expired projects in database, which uploaded more than 30 days ago. Async mode.
 * @param {function} callback - Callback function that handles query results
 * @returns {function} callback function
 * @async
 */
function checkExpiredProj(callback) {
    let db = new BetterDB('./db/projectDB.db');
    var sql = `SELECT projectCode AS pcode,
            projectDir AS dir,
            fileName AS fileName
            FROM Projects
            WHERE datetime(Date, 'localtime') <= datetime('now', '-30 day', 'localtime') 
            AND ProjectStatus <> 3
            AND doesExpire = 'true'`;
    let stmt = db.prepare(sql);
    let rows = stmt.all();
    db.close();
    return callback(null, rows);
}
module.exports = checkExpiredProj;
