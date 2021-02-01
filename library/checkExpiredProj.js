const sqlite3 = require('sqlite3').verbose();

/**
 * Get all expired projects in database, which uploaded more than 30 days ago. Async mode.
 * @param {function} callback - Callback function that handles query results
 * @returns {function} callback function
 * @async
 */
function checkExpiredProj(callback) {
    let db = new sqlite3.Database('./db/projectDB.db', (err) => {
        if (err) {
            console.error(err.message);
        }
    });
    var sql = `SELECT projectCode AS pcode,
            projectDir AS dir,
            fileName AS fileName
            FROM Projects
            WHERE datetime(Date, 'localtime') <= datetime('now', '-30 day', 'localtime') 
            AND ProjectStatus != 3
            AND doesExpire != false`;

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
module.exports = checkExpiredProj;