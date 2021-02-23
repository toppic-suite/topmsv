const Papa = require('papaparse');
const Database = require('better-sqlite3');
const fs = require('fs');
const myArgs = process.argv.slice(2);
const parameter = '********************** Parameters **********************';
//const specFDR = 'Spectrum-level cutoff value';
const betterDB = new Database(myArgs[0]);
const stmtCreateSequenceTable = betterDB.prepare('CREATE TABLE IF NOT EXISTS sequence (\n' +
    '    id INTEGER PRIMARY KEY,\n' +
    '    scan_id INTEGER NOT NULL,\n' +
    '    protein_accession TEXT NULL,\n' +
    '    proteoform TEXT NULL,\n' +
    '    spec_fdr TEXT NULL,\n' +
    '    FOREIGN KEY (scan_id)\n' +
    '       REFERENCES SPECTRA (ID)\n' +
    ');');
stmtCreateSequenceTable.run();
const insertMany = betterDB.transaction(importData);

//let specFDRValue = 'N/A';

let file = fs.readFileSync(myArgs[1], "utf-8");
file = findCSV(file);

insertMany(betterDB, file);

const stmtSeqIndex = betterDB.prepare("CREATE INDEX IF NOT EXISTS `sequence_index` ON `sequence` ( `scan_id` )");
stmtSeqIndex.run();
betterDB.close();

function importData(db, data) {
    const stmtFindScanID = db.prepare('SELECT ID AS id FROM SPECTRA WHERE SCAN = ?');
    const stmtInsert = db.prepare('INSERT INTO sequence(id,scan_id,protein_accession,proteoform,spec_fdr) VALUES(?,?,?,?,?)');
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
                let protein_accession = row[13];
                let proteoform = row[17];
                let qValue = row[25];

                if (isNaN(parseFloat(qValue))){
                    qValue = 'N/A';
                } 
                if (parseFloat(qValue) < 0){
                    qValue = 'N/A';
                }
                if(scan !== 'Scan(s)'){
                    let scan_id = stmtFindScanID.get(scan).id;
                    stmtInsert.run(id, scan_id,protein_accession, proteoform, qValue);
                    //stmtInsert.run(id, scan,protein_accession, proteoform, specFDRValue, protFDRValue);
                    id++;
                }
            })
        }
    });
}

function findCSV(data) {
    data = data.substring(parameter.length+1);
    let indexBegin = data.indexOf(parameter) + parameter.length + 1;
    data = data.trim();
    
    /*let paraData = data.substring(0, indexBegin);
    let fdr = paraData.indexOf('FDR');

    if (fdr > -1){
        let specFDRIndex = paraData.indexOf(specFDR);
        let specFDRVal = paraData.slice((specFDRIndex + specFDR.length + 1), paraData.indexOf('\n',specFDRIndex));

        specFDRValue = parseFloat(specFDRVal);
    }*/
    return data.slice(indexBegin);
}