var fs = require('fs');
const Database = require('better-sqlite3');
var myArgs = process.argv.slice(2);
const betterDB = new Database(myArgs[0]);
const stmtCreateEnvTable = betterDB.prepare('CREATE TABLE IF NOT EXISTS envelope (\n' +
    '    envelope_id INTEGER PRIMARY KEY,\n' +
    '    scan_id INTEGER NOT NULL,\n' +
    '    CHARGE REAL NOT NULL,\n' +
    '    THEO_MONO_MASS REAL NOT NULL,\n' +
    '    THEO_INTE_SUM REAL NULL,\n' +
    '    FOREIGN KEY (scan_id)\n' +
    '       REFERENCES SPECTRA (ID)\n' +
    ');');
stmtCreateEnvTable.run();
const stmtCreatePeakTable = betterDB.prepare('CREATE TABLE IF NOT EXISTS env_peak (\n' +
    '    env_peak_id INTEGER PRIMARY KEY,\n' +
    '    envelope_id INTEGER NOT NULL,\n' +
    '    mz REAL NOT NULL,\n' +
    '    intensity REAL NOT NULL,\n' +
    '    FOREIGN KEY (envelope_id)\n' +
    '       REFERENCES envelope (envelope_id)\n' +
    '       ON DELETE CASCADE\n' +
    ');');
stmtCreatePeakTable.run();
fs.readFile(myArgs[1], ((err, data) => {
    if (err) throw err;
    //betterDB.transaction(importData(betterDB,data.toString()));
    insertMany(betterDB,data.toString());
    var stmtPeakIndex = betterDB.prepare("CREATE INDEX IF NOT EXISTS `env_peak_index` ON `env_peak` ( `envelope_id` )");
    stmtPeakIndex.run();
    var stmtEnvIndex = betterDB.prepare("CREATE INDEX IF NOT EXISTS `envelope_index` ON `envelope` ( `scan_id` )");
    stmtEnvIndex.run();
    betterDB.close();
}));

const insertMany = betterDB.transaction(importData);

function importData(database,data) {
    var stmtPeak = database.prepare('INSERT INTO env_peak(env_peak_id,envelope_id, mz, intensity) VALUES(?,?,?,?)');
    var stmtEnv = database.prepare('INSERT INTO envelope(envelope_id,scan_id,CHARGE,THEO_MONO_MASS,THEO_INTE_SUM) VALUES(?,?,?,?,?)');

    var stmtFindScanID = database.prepare('SELECT ID AS id\n' +
        'FROM SPECTRA\n' +
        'WHERE SCAN = ?');
    var env_id = 1;
    var env_peak_id = 1;

    while(data.indexOf("END ENVELOPE")!== -1){
        var indexEnd = data.indexOf("END ENVELOPE")+ "END ENVELOPE".length + 1;
        var scan = findInfo("SCAN",data);
        var scan_id = stmtFindScanID.get(scan).id;
        var CHARGE=findInfo("CHARGE",data);
        var THEO_MONO_MASS=findInfo("THEO_MONO_MASS",data);
        var THEO_INTE_SUM=findInfo("THEO_INTE_SUM",data);
        stmtEnv.run(env_id,scan_id,CHARGE,THEO_MONO_MASS,THEO_INTE_SUM);
        findPeaks(data, function (lines) {
            lines.forEach(element => {
                var mz = parseFloat(element.split(" ")[0]);
                var inte = parseFloat(element.split(" ")[1]);
                stmtPeak.run(env_peak_id,env_id, mz, inte);
                env_peak_id = env_peak_id + 1;
            });
        });
        env_id = env_id + 1;
        data = data.substring(indexEnd);
    }
}

function findPeaks(data, callback) {
    var peaksBegin = data.indexOf("Theoretical Peak MZ values and Intensities") + "Theoretical Peak MZ values and Intensities".length+1;
    var peaksEnd = data.indexOf("Experimental Peak MZ values and Intensities")-1;
    var subStr = data.substring(peaksBegin, peaksEnd);
    var lines = subStr.split("\n");
    return callback(lines);
}
function findInfo(info, data) {
    var indexBegin = data.indexOf(info) + info.length + 1;
    var indexEnd = indexBegin + data.substring(indexBegin).indexOf("\n");
    return parseFloat(data.substring(indexBegin, indexEnd));
}