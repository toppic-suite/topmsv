export {}
const fs = require('fs');
const Database = require('better-sqlite3');
// const molecularFormulae = require('./distribution_calc/molecular_formulae');
// const calcDistrubution = new molecularFormulae();
const updateEnvStatusSync = require("../library/updateEnvStatusSync");

const myArgs = process.argv.slice(2);
const betterDB = new Database(myArgs[0]);
const stmtCreateEnvTable = betterDB.prepare('CREATE TABLE IF NOT EXISTS envelope (\n' +
    '    envelope_id INTEGER PRIMARY KEY,\n' +
    '    scan_id INTEGER NOT NULL,\n' +
    '    mono_mass REAL NULL,\n' +
    '    intensity REAL NULL,\n' +
    '    charge INTEGER NULL,\n' +
    '    FOREIGN KEY (scan_id)\n' +
    '       REFERENCES SPECTRA (SCAN)\n' +
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
// stmtCreateEnvPeakTable.run();

let projectCode = myArgs[2];
try {
    fs.readFile(myArgs[1], ((err, data) => {
        if (err) throw err;
        insertMany(betterDB,data.toString());
        const stmtEnvIndex = betterDB.prepare("CREATE INDEX IF NOT EXISTS `envelope_index` ON `envelope` ( `scan_id` )");
        stmtEnvIndex.run();
        // const stmtEnvPeakIndex = betterDB.prepare("CREATE INDEX IF NOT EXISTS `env_peak_index` ON `env_peak` ( `envelope_id` )");
        // stmtEnvPeakIndex.run();
        betterDB.close();
    }));
} catch (err) {
    console.log(err);
    updateEnvStatusSync(0, projectCode);
}

const insertMany = betterDB.transaction(importData);

function importData(database: any, data: string) {
    const stmtEnv = database.prepare('INSERT INTO envelope(envelope_id,scan_id,mono_mass,intensity,charge) VALUES(?,?,?,?,?)');
    // const stmtEnvPeak = database.prepare('INSERT INTO env_peak(env_peak_id, envelope_id, mz, intensity) VALUES(?,?,?,?)');

    const stmtFindScanID = database.prepare('SELECT SCAN AS id FROM SPECTRA WHERE SCAN = ?');
    const stmtMaxEnvID = database.prepare('SELECT MAX(envelope_id) AS maxEnvID FROM envelope');
    // const stmtMaxEnvPeakID = database.prepare('SELECT MAX(env_peak_id) AS maxEnvPeakID FROM env_peak');
    // const stmtGetPeakList = database.prepare('SELECT MZ AS mz, INTENSITY AS intensity FROM PEAKS WHERE SPECTRAID = ?');

    let env_id: number = stmtMaxEnvID.get().maxEnvID + 1;
    // let envPeakID = stmtMaxEnvPeakID.get().maxEnvPeakID + 1;

    while(data.indexOf("END IONS")!== -1){
        let scan: number = findInfo("SCANS",data);
        let scan_id: string = stmtFindScanID.get(scan).id;

        findEnv(data, function (lines: string[]) {
            lines.forEach((element: string) => {
                let mass: number = parseFloat(element.split("\t")[0]);
                let inte: number = parseFloat(element.split("\t")[1]);
                let charge: number = parseInt(element.split("\t")[2]);
                stmtEnv.run(env_id,scan_id,mass,inte,charge);

                // let peaks = stmtGetPeakList.all(scan_id);
                // let distributionResult = calcDistrubution.emass(mass,charge,peaks);
                // let peakList = distributionResult[0];
                // if (peakList === null) {
                //     env_id = env_id + 1;
                //     return;
                // }
                // stmtEnv.run(env_id,scan_id,mass,inte,charge);
                // peakList.forEach(peak => {
                //     stmtEnvPeak.run(envPeakID,env_id,peak.mz,peak.intensity);
                //     envPeakID++;
                // });
                env_id = env_id + 1;
            });
        });
        let indexEnd: number = data.indexOf("END IONS")+ "END IONS".length + 1;
        data = data.substring(indexEnd);
    }
}

function findEnv(data: string, callback: Function) {
    let inteEnd: number = data.indexOf('PRECURSOR_INTENSITY')+ "PRECURSOR_INTENSITY".length + 1;
    data = data.substring(inteEnd);
    let peaksBegin: number = data.indexOf("\n")+1;
    let peaksEnd: number = data.indexOf('END IONS');
    if (peaksBegin === peaksEnd) return;
    let subStr: string = data.substring(peaksBegin, peaksEnd-1);
    let lines: string[] = subStr.split("\n");
    return callback(lines);
}
function findInfo(info: string, data: string) {
    let indexBegin: number = data.indexOf(info) + info.length + 1;
    let indexEnd: number = indexBegin + data.substring(indexBegin).indexOf("\n");
    return parseFloat(data.substring(indexBegin, indexEnd));
}