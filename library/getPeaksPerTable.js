const BetterDB = require('better-sqlite3'); 
/**
 * Get maximum and minimum mz and rt for this mzML file.
 * @param {string} dir
 * @param {number} scanNum
 * @param {function} callback
 */
//don't seem to be used 
function getPeaksPerTable(dir, layerCount, callback) {
    /*let i = 0;
    let result = []; 
    let sql = 'SELECT ';
    if (isNaN(parseInt(layerCount))) {
        return callback("ERROR: invalid table number", null);
    }
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
    let db = new BetterDB(dbDir);
    let stmt = db.prepare(sql);
    let rows = stmt.get();
    db.close();    
    return callback(null, rows);*/
}
module.exports = getPeaksPerTable;