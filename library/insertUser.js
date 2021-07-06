const BetterDB = require('better-sqlite3'); 
/**
 * Insert new user into database.
 * @param {number} uid - User ID
 * @param {string} email - Email address
 * @param {string} firstname - First name
 * @param {string} lastname - Last name
 * @param {string} fullname - Full name
 */
function insertUser(uid, email, firstname, lastname, fullname){
    let db = new BetterDB('./db/projectDB.db');
    let sql = 'INSERT INTO Users(uid, email, firstname, lastname, fullname) VALUES(?,?,?,?,?)';
    let stmt = db.prepare(sql);
    let rows = stmt.all(uid, email, firstname, lastname, fullname);

    db.close();
    console.log(`A row has been inserted with rowid ${this.lastInsertRowid}`);
}
module.exports = insertUser;