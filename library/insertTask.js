const sqlite3 = require('sqlite3').verbose();
/**
 * Insert new task to waitlist. Async mode.
 * @param {string} projectCode
 * @param {string} app
 * @param {string} parameter
 * @param {number} threadNum
 * @param {number} finish
 * @async
 * @deprecated
 */
function insertTask(projectCode, app, parameter, threadNum, finish) {
    let db = new sqlite3.Database('./db/projectDB.db', (err) => {
        if (err) {
            console.error(err.message);
        }
        // console.log('Connected to the result database.');
    });
    let sql = 'INSERT INTO Tasks(projectCode, app, parameter, threadNum, finish) VALUES(?,?,?,?,?)';
    db.run(sql, [projectCode, app, parameter, threadNum, finish], function(err) {
        if (err) {
            return console.log(err.message);
        }
        // get the last insert id
        console.log(`A row has been inserted with rowid ${this.lastID}`);
    });
    db.close();
}
module.exports = insertTask;