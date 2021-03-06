const sqlite3 = require('sqlite3').verbose();
/**
 * Insert new user into database. Async mode.
 * @param {number} uid - User ID
 * @param {string} email - Email address
 * @param {string} firstname - First name
 * @param {string} lastname - Last name
 * @param {string} fullname - Full name
 * @async
 */
function insertUser(uid, email, firstname, lastname, fullname){
    let db = new sqlite3.Database('./db/projectDB.db', (err) => {
        if (err) {
            console.error(err.message);
        }
        // console.log('Connected to the result database.');
    });
    let sql = 'INSERT INTO Users(uid, email, firstname, lastname, fullname) VALUES(?,?,?,?,?)';
    db.run(sql, [uid, email, firstname, lastname, fullname], function(err) {
        if (err) {
            return console.log(err.message);
        }
        // get the last insert id
        console.log(`A row has been inserted with rowid ${this.lastID}`);
    });
    db.close();
}
module.exports = insertUser;