export{}

const fs = require('fs');
const Database = require('better-sqlite3');
const myArgs = process.argv.slice(2);
const betterDB = new Database(myArgs[0]);
const stmtCreateEnvTable = betterDB.prepare('CREATE TABLE IF NOT EXISTS envelope (\n' +
    '    envelope_id INTEGER PRIMARY KEY,\n' +
    '    scan_id INTEGER NOT NULL,\n' +
    '    charge REAL NOT NULL,\n' +
    '    mono_mass REAL NOT NULL,\n' +
    '    intensity REAL NULL,\n' +
    '    FOREIGN KEY (scan_id)\n' +
    '       REFERENCES SPECTRA (SCAN)\n' +
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
    const stmtPeakIndex = betterDB.prepare("CREATE INDEX IF NOT EXISTS `env_peak_index` ON `env_peak` ( `envelope_id` )");
    stmtPeakIndex.run();
    const stmtEnvIndex = betterDB.prepare("CREATE INDEX IF NOT EXISTS `envelope_index` ON `envelope` ( `scan_id` )");
    stmtEnvIndex.run();
    betterDB.close();
}));

const insertMany = betterDB.transaction(importData);

function importData(database: any, data: string) {
    const stmtPeak = database.prepare('INSERT INTO env_peak(env_peak_id,envelope_id, mz, intensity) VALUES(?,?,?,?)');
    const stmtEnv = database.prepare('INSERT INTO envelope(envelope_id,scan_id,charge,mono_mass,intensity) VALUES(?,?,?,?,?)');

    const stmtFindScanID = database.prepare('SELECT ID AS id\n' +
        'FROM SPECTRA\n' +
        'WHERE SCAN = ?');
    let env_id: number = 1;
    let env_peak_id: number = 1;

    while(data.indexOf("END ENVELOPE")!== -1){
        let indexEnd: number = data.indexOf("END ENVELOPE")+ "END ENVELOPE".length + 1;
        let scan: number = findInfo("SCAN",data);
        let scan_id: string = stmtFindScanID.get(scan).id;
        let CHARGE: number = findInfo("CHARGE",data);
        let THEO_MONO_MASS: number = findInfo("THEO_MONO_MASS",data);
        let THEO_INTE_SUM: number = findInfo("THEO_INTE_SUM",data);
        stmtEnv.run(env_id,scan_id,CHARGE,THEO_MONO_MASS,THEO_INTE_SUM);
        findPeaks(data, function (lines: string[]) {
            lines.forEach((element: string) => {
                let mz: number = parseFloat(element.split(" ")[0]);
                let inte: number = parseFloat(element.split(" ")[1]);
                stmtPeak.run(env_peak_id,env_id, mz, inte);
                env_peak_id = env_peak_id + 1;
            });
        });
        env_id = env_id + 1;
        data = data.substring(indexEnd);
    }
}

function findPeaks(data: string, callback: Function) {
    let peaksBegin: number = data.indexOf("Theoretical Peak MZ values and Intensities") + "Theoretical Peak MZ values and Intensities".length + 1;
    let peaksEnd: number = data.indexOf("Experimental Peak MZ values and Intensities") - 1;
    let subStr: string = data.substring(peaksBegin, peaksEnd);
    let lines: string[] = subStr.split("\n");
    return callback(lines);
}
function findInfo(info: string, data: string) {
    let indexBegin: number = data.indexOf(info) + info.length + 1;
    let indexEnd: number = indexBegin + data.substring(indexBegin).indexOf("\n");
    return parseFloat(data.substring(indexBegin, indexEnd));
}