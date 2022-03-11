export{}

const fs = require('fs');
const Database = require('better-sqlite3');
const myArgs = process.argv.slice(2);
console.log("myArgs: ", myArgs);

const betterDB: any = new Database(myArgs[0]);
//ID,Fraction_ID,Envelope_num,Mass,MonoMz,Charge,Intensity,mzLo,mzHi,rtLo,rtHi,color,opacity,promex_score
//0,0,9,7255.92,1452.19,5,1.30074e+08,1452.09,1454.5,39.787,40.4685,#FF0000,0.1,54.0487
const stmtCreateFeatureTable: any = betterDB.prepare(
    'CREATE TABLE IF NOT EXISTS feature (\n' +
    '    id INTEGER PRIMARY KEY,\n' +
    '    feature_id INTEGER NOT NULL,\n' +
    '    fraction_id INTEGER NOT NULL,\n' +
    '    envelope_num INTEGER NOT NULL,\n' +
    '    mass REAL NULL,\n' +
    '    mono_mz REAL NULL,\n' +
    '    charge INTEGER NULL,\n' +
    '    intensity REAL NULL,\n' +
    '    mz_low REAL NULL,\n' +
    '    mz_high REAL NULL,\n' +
    '    rt_low REAL NULL,\n' +
    '    rt_high REAL NULL,\n' +
    '    promex_score REAL NULL\n' +
    ');');

stmtCreateFeatureTable.run();
fs.readFile(myArgs[1], ((err, data) => {
    if (err) throw err;
    insertMany(betterDB,data.toString());
    const stmtFeatureIndex: any = betterDB.prepare("CREATE INDEX IF NOT EXISTS `feature_index` ON `feature` ( rt_high,rt_low,mz_high,mz_low )");
    stmtFeatureIndex.run();
    betterDB.close();
}));
const insertMany: any = betterDB.transaction(importData);

function importData(database,data): void {
    let stmtFeature: any = database.prepare('INSERT INTO feature(feature_id, fraction_id,envelope_num,mass,mono_mz,charge,intensity,mz_low,mz_high,rt_low,rt_high,promex_score) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)');
    let skipIndex: number = data.indexOf("\n");//to skip the first row (header)
    data = data.substring(skipIndex + 1);
    let lines: string[] = data.split("\n");

    for (let i: number = 0; i < lines.length; i++){
        let line: string = lines[i];
        line = line.replace(/[\n\r]/g, "");
        if (line != ""){
            let element: string[] = line.split(",");
            let feat_id: number = parseInt(element[0]);
            let frac_id: number = parseInt(element[1]);
            let env_num: number = parseInt(element[2]);
            let mass: number = parseFloat(element[3]);
            let mono_mz: number = parseFloat(element[4]);
            let charge: number = parseInt(element[5]);
            let intensity: number = parseFloat(element[6]);
            let mz_low: number = parseFloat(element[7]);
            let mz_high: number = parseFloat(element[8]);
            let rt_low: number = parseFloat(element[9]);
            let rt_high: number = parseFloat(element[10]);
            let promex_score: number = parseFloat(element[13]);
            stmtFeature.run(feat_id, frac_id, env_num, mass, mono_mz, charge, intensity, mz_low, mz_high, rt_low, rt_high, promex_score);
        };
    }
}