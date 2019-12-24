var fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
var myArgs = process.argv.slice(2);
console.log('myArgs: ', myArgs);
console.log('first arg', myArgs[0]);
let db = new sqlite3.Database(myArgs[0], sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to database.');
    var sqlToCreateEnvTable = 'CREATE TABLE IF NOT EXISTS envelope (\n' +
        '    envelope_id INTEGER PRIMARY KEY,\n' +
        '    scan_id TEXT NOT NULL,\n' +
        '    CHARGE REAL NOT NULL,\n' +
        '\tTHEO_MONO_MASS REAL NOT NULL,\n' +
        '    FOREIGN KEY (scan_id)\n' +
        '       REFERENCES SPECTRA (ID)\n' +
        ');';
    db.run(sqlToCreateEnvTable, function (err) {
        if (err) {
            return console.log(err.message);
        }
        console.log("Table envelope is ready!");
        /*var sqlToCreateEnvIndex = "CREATE INDEX IF NOT EXISTS `envelope_index` ON `envelope` ( `envelope_id`, `scan_id` )";
        db.run(sqlToCreateEnvIndex, function (err) {
            if (err) {
                return console.log(err.message);
            }
            console.log("Index for envelope is ready!");
        });*/
        var sqlToCreateEnvPeakTable = 'CREATE TABLE IF NOT EXISTS env_peak (\n' +
            '    env_peak_id INTEGER PRIMARY KEY,\n' +
            '    envelope_id TEXT NOT NULL,\n' +
            '    mz REAL NOT NULL,\n' +
            '    intensity REAL NOT NULL,\n' +
            '    FOREIGN KEY (envelope_id)\n' +
            '       REFERENCES envelope (envelope_id)\n' +
            ');';
        db.run(sqlToCreateEnvPeakTable, function (err) {
            if (err) {
                return console.log(err.message);
            }
            console.log("Table env_peak is ready!");
            /*var sqlToCreateEnvPeakIndex = "CREATE INDEX IF NOT EXISTS `env_peak_index` ON `env_peak` ( `env_peak_id`, `envelope_id` )";
            db.run(sqlToCreateEnvPeakIndex, function (err) {
                if (err) {
                    return console.log(err.message);
                }
                console.log("Index for env_peak is ready!");
            });*/
        });
    });

    /*var sqlToCreateTable = 'CREATE TABLE IF NOT EXISTS envelope (\n' +
        '    envelope_id INTEGER PRIMARY KEY,\n' +
        '    scan_id TEXT NOT NULL,\n' +
        '    CHARGE REAL NOT NULL,\n' +
        '    THEO_PEAK_NUM REAL NOT NULL,\n' +
        '\tREAL_PEAK_NUM REAL NOT NULL,\n' +
        '\tTHEO_MONO_MZ REAL NOT NULL,\n' +
        '\tREAL_MONO_MZ REAL NOT NULL,\n' +
        '\tTHEO_MONO_MASS REAL NOT NULL,\n' +
        '\tREAL_MONO_MASS REAL NOT NULL,\n' +
        '\tTHEO_INTE_SUM REAL NOT NULL,\n' +
        '\tREAL_INTE_SUM REAL NULL,\n' +
        '\tBASELINE_INTE REAL NOT NULL,\n' +
        '    FOREIGN KEY (scan_id)\n' +
        '       REFERENCES SPECTRA (ID)\n' +
        ');';*/
});
fs.readFile(myArgs[1], ((err, data) => {
    if (err) throw err;
    //console.log(data.toString());
/*    db.serialize(function () {
        importData(db,data.toString());
        db.close();
    })*/
    importData(db,data.toString());
    //var scanID = req.query.scanID;
    //showData(db,1483,null);
    //createEnvIndex(db);
    //db.close();
    //console.log('Close database');
}));
//db.close();


let times = 0;
let result=[];
function showData(db,scan_id,res) {
    getEnvNum(db, scan_id, function (err, rows) {
        console.log(rows.length);
        console.log(typeof rows);
        let max = rows.length;
        if (rows.length === 0){
            console.log("Empty rows!");
        }
        else {
            rows.forEach(envelope => {
                let id = envelope.id;
                let charge = envelope.charge;
                let mono_mass = envelope.mono_mass;
                let oneEnvelope = {};
                oneEnvelope.mono_mass = mono_mass;
                oneEnvelope.charge = charge;
                getEnvPeakList(db,id, function(err, rows) {
                    oneEnvelope.env_peaks=rows;
                    result.push(oneEnvelope);
                    ++times;
                    if(times === max){
                        console.log(JSON.stringify(result));
                        db.close();
                    }
                });
            });
        }
    });
}

function getEnvNum(db, scanid,callback) {
    let sql = `SELECT envelope_id AS id,THEO_MONO_MASS AS mono_mass, CHARGE AS charge
                FROM envelope
                WHERE scan_id = ?`;
    db.all(sql, [scanid], (err, rows) => {
        if(err) {
            throw err;
        }
        return callback(null, rows);
    });
    //db.close();
}

function getEnvPeakList(db, envelope_id, callback) {
    let sql = `SELECT mz, intensity
                FROM env_peak
                WHERE envelope_id = ?`;
    db.all(sql, [envelope_id], (err, rows) => {
        if (err) {
            throw err;
        }
        return callback(null,rows);
    });
    //db.close();
}
function getEnvCharge(db, envelope_id, callback) {
    let sql = `SELECT THEO_MONO_MASS AS mono_mass, CHARGE AS charge
                FROM envelope
                WHERE envelope_id = ?`;
    db.get(sql, [envelope_id], (err, row) => {
        if(err) {
            throw err;
        }
        return callback(null, row);
    });
    //db.close();
}

function importData(database,data) {
    database.serialize(function () {
        database.run("BEGIN TRANSACTION");
        var stmtPeak = database.prepare('INSERT INTO env_peak(env_peak_id,envelope_id, mz, intensity) VALUES(?,?,?,?)');
        var stmtEnv = database.prepare('INSERT INTO envelope(envelope_id,scan_id,CHARGE,THEO_MONO_MASS) VALUES(?,?,?,?)');
        var stmtPeakIndex = database.prepare("CREATE INDEX IF NOT EXISTS `env_peak_index` ON `env_peak` ( `env_peak_id`, `envelope_id` )");
        var stmtEnvIndex = database.prepare("CREATE INDEX IF NOT EXISTS `envelope_index` ON `envelope` ( `envelope_id`, `scan_id` )");

        var env_id = 1;
        while(data.indexOf("END ENVELOPE")!== -1){
            //var indexBegin = data.indexOf("SPEC_ID");
            var indexEnd = data.indexOf("END ENVELOPE")+ "END ENVELOPE".length + 1;
            //var env = data.substring(indexBegin,indexEnd);
            var scan = findInfo("SCAN",data);
            //console.log(scan);
            var env_peak_id = 1;
            // var env_id = 1;
            findScanID(database, scan, data, function (row,data) {
                //console.log("ID: " +row.id);
                var scan_id = row.id;
                //console.log(data);
                var CHARGE=findInfo("CHARGE",data);
                /*var THEO_PEAK_NUM=findInfo("THEO_PEAK_NUM",data);
                var REAL_PEAK_NUM=findInfo("REAL_PEAK_NUM",data);
                var THEO_MONO_MZ=findInfo("THEO_MONO_MZ",data);
                var REAL_MONO_MZ=findInfo("REAL_MONO_MZ",data);*/
                var THEO_MONO_MASS=findInfo("THEO_MONO_MASS",data);
                /*var REAL_MONO_MASS=findInfo("REAL_MONO_MASS",data);
                var THEO_INTE_SUM=findInfo("THEO_INTE_SUM",data);
                var REAL_INTE_SUM=findInfo("REAL_INTE_SUM",data);
                var BASELINE_INTE=findInfo("BASELINE_INTE",data);*/
                //console.log("charge: " + REAL_PEAK_NUM);
                //insertEnv(db,env_id,scan_id,CHARGE,THEO_PEAK_NUM,REAL_PEAK_NUM,THEO_MONO_MZ,REAL_MONO_MZ,THEO_MONO_MASS,REAL_MONO_MASS,THEO_INTE_SUM,REAL_INTE_SUM,BASELINE_INTE);
                //insertEnv(database,env_id,scan_id,CHARGE,THEO_MONO_MASS);
                stmtEnv.run([env_id,scan_id,CHARGE,THEO_MONO_MASS]);
                findPeaks(data, function (lines) {
                    //database.run("BEGIN TRANSACTION");
                    lines.forEach(element => {
                        //console.log(env_peak_id);
                        var mz = parseFloat(element.split(" ")[0]);
                        var inte = parseFloat(element.split(" ")[1]);
                        stmtPeak.run([env_peak_id,env_id, mz, inte]);
                        //insertPeak(database,env_peak_id,env_id, mz, inte);
                        env_peak_id = env_peak_id + 1;
                    });
                    //database.run("COMMIT");
                });
                env_id = env_id + 1;

                //console.log(peaks);
            });
            data = data.substring(indexEnd);
            //console.log(data);
        }
        //createEnvIndex(database);
        //database.close();
        stmtEnvIndex.run();
        stmtPeakIndex.run();

        database.run("COMMIT");
/*
        stmtEnv.finalize();
        stmtPeak.finalize();
        stmtEnvIndex.finalize();
        stmtPeakIndex.finalize();
*/
        //db.close();
    });

    database.close((err) => {
        if (err) {
            return console.error(err.message);
        }
    });

}

function findPeaks(data, callback) {
    var peaksBegin = data.indexOf("Theoretical Peak MZ values and Intensities") + "Theoretical Peak MZ values and Intensities".length+1;
    var peaksEnd = data.indexOf("Experimental Peak MZ values and Intensities")-1;
    var subStr = data.substring(peaksBegin, peaksEnd);
    var lines = subStr.split("\n");
    return callback(lines);
    //return lines;
}
function findInfo(info, data) {
    var indexBegin = data.indexOf(info) + info.length + 1;
    var indexEnd = indexBegin + data.substring(indexBegin).indexOf("\n");
    return parseFloat(data.substring(indexBegin, indexEnd));
}
function findScanID(database,scan,data, callback) {
    var sql = 'SELECT ID AS id\n' +
        'FROM SPECTRA\n' +
        'WHERE SCAN = ?';
    database.get(sql, [scan], (err, row) => {
        if (err) {
            return callback(err);
        } else {
            return callback(row,data);
        }
    });
}
function insertPeak(database,id, scan_id, mz, inte) {
    //let sql = 'INSERT INTO env_peak(env_peak_id,envelope_id, mz, intensity) VALUES(?,?,?,?)';
    let stmt = database.prepare('INSERT INTO env_peak(env_peak_id,envelope_id, mz, intensity) VALUES(?,?,?,?)');
    stmt.run([id,scan_id, mz, inte]);
    /*database.parallelize(function () {
        database.run(sql,[id,scan_id, mz, inte], function (err) {
            if (err) {
                return console.log(err.message);
            }
            // get the last insert id
            //console.log(`A row has been inserted with scan_id ${scan_id}`);
        });
    });*/
}
/*function insertEnv(db,id,scan_id,CHARGE,THEO_PEAK_NUM,REAL_PEAK_NUM,THEO_MONO_MZ,REAL_MONO_MZ,THEO_MONO_MASS,REAL_MONO_MASS,THEO_INTE_SUM,REAL_INTE_SUM,BASELINE_INTE){
    var sql = 'INSERT INTO envelope(envelope_id,scan_id,CHARGE,THEO_PEAK_NUM,REAL_PEAK_NUM,THEO_MONO_MZ,REAL_MONO_MZ,THEO_MONO_MASS,REAL_MONO_MASS,THEO_INTE_SUM,REAL_INTE_SUM,BASELINE_INTE) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)';
    db.run(sql,[id,scan_id,CHARGE,THEO_PEAK_NUM,REAL_PEAK_NUM,THEO_MONO_MZ,REAL_MONO_MZ,THEO_MONO_MASS,REAL_MONO_MASS,THEO_INTE_SUM,REAL_INTE_SUM,BASELINE_INTE], function (err) {
        if (err) {
            return console.log(err.message);
        }
        // get the last insert id
        //console.log(`A row has been inserted with scan_id ${scan_id}`);
    })
}*/
function insertEnv(database,id,scan_id,CHARGE,THEO_MONO_MASS){
    let sql = 'INSERT INTO envelope(envelope_id,scan_id,CHARGE,THEO_MONO_MASS) VALUES(?,?,?,?)';
    database.run(sql,[id,scan_id,CHARGE,THEO_MONO_MASS], function (err) {
        if (err) {
            return console.log(err.message);
        }
        // get the last insert id
        //console.log(`A row has been inserted with scan_id ${scan_id}`);
    })
}

function createEnvIndex(database) {
    let sqlToCreateEnvPeakIndex = "CREATE INDEX IF NOT EXISTS `env_peak_index` ON `env_peak` ( `env_peak_id`, `envelope_id` )";
    database.run(sqlToCreateEnvPeakIndex, function (err) {
        if (err) {
            return console.log(err.message);
        }
        console.log("Index for env_peak is ready!");
    });
    let sqlToCreateEnvIndex = "CREATE INDEX IF NOT EXISTS `envelope_index` ON `envelope` ( `envelope_id`, `scan_id` )";
    database.run(sqlToCreateEnvIndex, function (err) {
        if (err) {
            return console.log(err.message);
        }
        console.log("Index for envelope is ready!");
    });
}