const sqlite3 = require('sqlite3').verbose();
/**
 * Get maximum and minimum mz and rt for this mzML file.
 * @param {string} dir
 * @param {number} scanNum
 * @param {function} callback
 * @async
 */
function getPeaksPerTable(dir, layerCount, callback) {
    let i = 0;
    let result = []; 
    let sql = 'SELECT ';
    for (let i = 0; i < layerCount; i++){
        let stmt = `(SELECT COUNT(*) FROM PEAKS` + i.toString() +`) AS C`+ i.toString();
        if (i>0){
            let and = `, ` ;
            stmt = and.concat(stmt);
        }
        if (i == layerCount - 1){
            stmt = stmt.concat(`;`);
        }
        sql = sql.concat(stmt);
    }
    //sql statement count rows from all PEAKS0-PEAKSn table
    let dbDir = dir;
    let resultDb = new sqlite3.Database(dbDir, (err) => {
        if (err) {
            console.error("error during db generation", err.message);
        }
    // console.log('Connected to the result database.');
    });
    resultDb.get(sql, (err, row) => {
    if (err) {
        throw err; 
    }
        return callback(null, row);
    })
    resultDb.close();    
}
module.exports = getPeaksPerTable;