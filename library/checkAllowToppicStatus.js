const sqlite3 = require('sqlite3').verbose();

/**
 * Get allowToppic status by Tasks.projectCode. Sync mode.
 * @param {string} projectCode - Project Code
 * @returns {Object} Object contains projectStatus
 */
function checkAllowToppicStatus(projectCode, callback) {
    let db = new sqlite3.Database('./db/projectDB.db', (err) => {
        if (err) {
            console.error(err.message);
        }
    });

    let sql = `SELECT allowToppic AS allowToppic FROM Projects WHERE projectCode = ?;`;
    db.get(sql,[projectCode], function (err, row) {
        if (err) {
            console.error(err.message);
            return err;
        }
        return callback(err, row);
    })
    db.close();
}
module.exports = checkAllowToppicStatus;
