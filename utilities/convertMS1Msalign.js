var fs = require('fs');
const Database = require('better-sqlite3');
const molecularFormulae = require('./distribution_calc/molecular_formulae');
const calcDistrubution = new molecularFormulae();
var myArgs = process.argv.slice(2);
// console.log(myArgs);
const betterDB = new Database(myArgs[0]);
const stmtCreateEnvTable = betterDB.prepare('CREATE TABLE IF NOT EXISTS envelope (\n' +
    '    envelope_id INTEGER PRIMARY KEY,\n' +
    '    scan_id INTEGER NOT NULL,\n' +
    '    mono_mass REAL NULL,\n' +
    '    intensity REAL NULL,\n' +
    '    charge INTEGER NULL,\n' +
    '    FOREIGN KEY (scan_id)\n' +
    '       REFERENCES SPECTRA (ID)\n' +
    ');');
const stmtCreateEnvPeakTable = betterDB.prepare('CREATE TABLE IF NOT EXISTS env_peak (\n' +
    '    env_peak_id INTEGER PRIMARY KEY,\n' +
    '    envelope_id INTEGER NOT NULL,\n' +
    '    mz REAL NULL,\n' +
    '    intensity REAL NULL,\n' +
    '    FOREIGN KEY (envelope_id)\n' +
    '       REFERENCES envelope (envelope_id)\n' +
    '       ON DELETE CASCADE\n' +
    ');');
stmtCreateEnvTable.run();
stmtCreateEnvPeakTable.run();
fs.readFile(myArgs[1], ((err, data) => {
    if (err) throw err;
    insertMany(betterDB,data.toString());
    var stmtEnvIndex = betterDB.prepare("CREATE INDEX IF NOT EXISTS `envelope_index` ON `envelope` ( `scan_id` )");
    stmtEnvIndex.run();
    var stmtEnvPeakIndex = betterDB.prepare("CREATE INDEX IF NOT EXISTS `env_peak_index` ON `env_peak` ( `envelope_id` )");
    stmtEnvPeakIndex.run();
    betterDB.close();
}));

const insertMany = betterDB.transaction(importData);

function importData(database,data) {
    var stmtEnv = database.prepare('INSERT INTO envelope(envelope_id,scan_id,mono_mass,intensity,charge) VALUES(?,?,?,?,?)');
    var stmtEnvPeak = database.prepare('INSERT INTO env_peak(env_peak_id, envelope_id, mz, intensity) VALUES(?,?,?,?)');
    var stmtFindScanID = database.prepare('SELECT ID AS id FROM SPECTRA WHERE SCAN = ?');
    var stmtMaxEnvID = database.prepare('SELECT MAX(envelope_id) AS maxEnvID FROM envelope');
    var stmtMaxEnvPeakID = database.prepare('SELECT MAX(env_peak_id) AS maxEnvPeakID FROM env_peak');
    var stmtGetPeakList = database.prepare('SELECT MZ AS mz, INTENSITY AS intensity FROM PEAKS WHERE SPECTRAID = ?');

    var env_id = stmtMaxEnvID.get().maxEnvID + 1;
    var envPeakID = stmtMaxEnvPeakID.get().maxEnvPeakID + 1;

    while(data.indexOf("END IONS")!== -1){
        var scan = findInfo("SCANS",data);
        var scan_id = stmtFindScanID.get(scan).id;
        findEnv(data, function (lines) {
            lines.forEach(element => {
                var mass = parseFloat(element.split("\t")[0]);
                var inte = parseFloat(element.split("\t")[1]);
                var charge = parseInt(element.split("\t")[2]);
                // console.log(mass, inte, charge);
                // console.log("env_id", env_id);
                // stmtEnv.run(env_id,scan_id,mass,inte,charge);

                var peaks = stmtGetPeakList.all(scan_id);
                // console.log("peaks", peaks);
                var peakList = calcDistrubution.emass(mass,charge,peaks);
                // console.log("peakList",peakList);
                if (peakList === null) {
                    env_id = env_id + 1;
                    return;
                }
                stmtEnv.run(env_id,scan_id,mass,inte,charge);
                peakList.forEach(peak => {
                    stmtEnvPeak.run(envPeakID,env_id,peak.mz,peak.intensity);
                    envPeakID++;
                });
                env_id = env_id + 1;
            });
        });
        var indexEnd = data.indexOf("END IONS")+ "END IONS".length + 1;
        data = data.substring(indexEnd);
    }
}

function findEnv(data, callback) {
    var inteEnd = data.indexOf('LEVEL',data)+ "LEVEL".length + 1;
    data = data.substring(inteEnd);
    var peaksBegin = data.indexOf("\n")+1;
    var peaksEnd = data.indexOf('END IONS');
    if (peaksBegin === peaksEnd) return;
    var subStr = data.substring(peaksBegin, peaksEnd-1);
    var lines = subStr.split("\n");
    return callback(lines);
}
function findInfo(info, data) {
    var indexBegin = data.indexOf(info) + info.length + 1;
    var indexEnd = indexBegin + data.substring(indexBegin).indexOf("\n");
    return parseFloat(data.substring(indexBegin, indexEnd));
}