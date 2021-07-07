const Papa = require('papaparse');
const Database = require('better-sqlite3');
const fs = require('fs');

const myArgs = process.argv.slice(2);
const parameter = '********************** Parameters **********************';
const fixedPtm = "********************** Fixed PTM **********************";
const commonPtm = "********************** Common PTM **********************";
const varPtm = "********************** Variable PTM **********************";
const fixedMod = 'Fixed modifications:';
const betterDB = new Database(myArgs[0]);
const stmtCreateSequenceTable = betterDB.prepare('CREATE TABLE IF NOT EXISTS sequence (\n' +
    '    id INTEGER PRIMARY KEY,\n' +
    '    scan_id INTEGER NOT NULL,\n' +
    '    protein_accession TEXT NOT NULL,\n' +
    '    prec_mass REAL NOT NULL,\n' +
    '    proteoform TEXT NOT NULL,\n' +
    '    q_value TEXT NULL,\n' +
    '    e_value TEXT NULL,\n' +
    '    FOREIGN KEY (scan_id)\n' +
    '       REFERENCES SPECTRA (SCAN)\n' +
    ');');
stmtCreateSequenceTable.run();
const insertMany = betterDB.transaction(importData);

//let specFDRValue = 'N/A';
fs.writeFile('input.txt', myArgs[1], function(err, data){})
let file = fs.readFileSync(myArgs[1], "utf-8");
let projectCode = myArgs[2];
file = findCSV(file);

insertMany(betterDB, file);

const stmtSeqIndex = betterDB.prepare("CREATE INDEX IF NOT EXISTS `sequence_index` ON `sequence` ( `scan_id` )");
stmtSeqIndex.run();
betterDB.close();

function importData(db, data) {
    const stmtFindScanID = db.prepare('SELECT SCAN AS id FROM SPECTRA WHERE SCAN = ?');
    const stmtInsert = db.prepare('INSERT INTO sequence(id,scan_id,protein_accession,prec_mass,proteoform,q_value, e_value) VALUES(?,?,?,?,?,?,?)');
    const stmtMaxSeqID = db.prepare('SELECT MAX(id) AS maxID FROM sequence');
    let id = stmtMaxSeqID.get().maxID + 1;
    Papa.parse(data, {
        complete: function(results) {
            // console.log("Finished:", results);
            let parseResult = results.data.slice(1);
            // console.log("parseResult", parseResult);
            parseResult.forEach(row => {
                // console.log(row);
                // console.log('Scans:', row[4]);
                let scan = row[4];
                // console.log('Proteoform:', row[17]);
                let prec_mass = row[8];
                let protein_accession = row[13];
                let proteoform = row[17];
                let qValue = row[24];//spectral q-value
                let eValue = row[23];

                if (isNaN(parseFloat(qValue))){
                    qValue = 'N/A';
                } 
                if (parseFloat(qValue) < 0){
                    qValue = 'N/A';
                }

                if (isNaN(parseFloat(eValue))){
                    eValue = 'N/A';
                } 
                if (parseFloat(eValue) < 0){
                    eValue = 'N/A';
                }

                if(scan !== 'Scan(s)'){
                    let scan_id = stmtFindScanID.get(scan).id;
                    stmtInsert.run(id, scan_id,protein_accession, prec_mass, proteoform, qValue, eValue);
                    id++;
                }
            })
        }
    });
}
function findCSV(data) {
    let indexBegin = 0;

    if (data.indexOf(varPtm) >= 0) {
        data = data.substring(varPtm.length+1);
        indexBegin = data.indexOf(varPtm) + varPtm.length + 1;
    }
    else if (data.indexOf(commonPtm) >= 0) {
        data = data.substring(data.indexOf(commonPtm) + commonPtm.length + 1);
        indexBegin = data.indexOf(commonPtm) + commonPtm.length + 1;
    }
    else if (data.indexOf(fixedPtm) >= 0) {
        data = data.substring(data.indexOf(fixedPtm) + fixedPtm.length + 1);
        indexBegin = data.indexOf(fixedPtm) + fixedPtm.length + 1;
    }
    else{
        data = data.substring(parameter.length+1);
        indexBegin = data.indexOf(parameter) + parameter.length + 1;
    }
    data = data.trim();
    return data.slice(indexBegin);
}
