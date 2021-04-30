const sqlite3 = require('sqlite3').verbose();

/**
 * Get all about-to-expire projects in database, which were uploaded more than 29 days ago. Async mode.
 * @param {function} callback - Callback function that handles query results
 * @returns {function} callback function
 * @async
 */
function checkNearExpiredProj(callback) {
    let db = new sqlite3.Database('./db/projectDB.db', (err) => {
        if (err) {
            console.error(err.message);
        }
    });
    var sql = `SELECT projectCode AS pcode,
            ProjectName AS projectName,
            FileName AS fileName,
            Email AS email
            FROM Projects
            WHERE datetime(Date, 'localtime') <= datetime('now', '-29 day', 'localtime') 
            AND ProjectStatus <> 3
            AND doesExpire = 'true'`;

    db.all(sql,(err, rows) => {
        if (err) {
            throw err;
        }
        else {
            return callback(null, rows);
        }
    });
    db.close();
}
module.exports = checkNearExpiredProj;