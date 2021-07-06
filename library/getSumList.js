const BetterDB = require('better-sqlite3'); 
/**
 * Get all peak intensity sums of scan level one. 
 * @param {string} dir - Project directory
 * @param {function} callback - Callback function that handles query results
 * @returns {function} Callback function
 */

function getSumList(dir, callback) {
    /*let sql = `SELECT RETENTIONTIME AS rt,
                PEAKSINTESUM AS inteSum,
                SCAN AS scanNum,
                IONTIME AS ionTime
                FROM SPECTRA
                WHERE SCANLEVEL = 1`;*/
    let sql = `SELECT * FROM SPECTRA
                WHERE SCANLEVEL = 1`;            
    //ORDER BY INTENSITY DESC`;
    //LIMIT 1000`;
    let dbDir = dir.substr(0, dir.lastIndexOf(".")) + ".db";
    let db = new BetterDB(dbDir);
    let stmt = db.prepare(sql);
    let rows = stmt.all();

    db.close();

    return callback(null, rows);
}
module.exports = getSumList;