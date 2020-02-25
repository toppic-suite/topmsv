var Papa = require('papaparse');
const Database = require('better-sqlite3');
var fs = require('fs');
var myArgs = process.argv.slice(2);
const parameter = '********************** Parameters **********************';
const betterDB = new Database(myArgs[0]);
const stmtCreateSequenceTable = betterDB.prepare('CREATE TABLE IF NOT EXISTS sequence (\n' +
    '    id INTEGER PRIMARY KEY,\n' +
    '    scan_id INTEGER NOT NULL,\n' +
    '    protein_accession TEXT NULL,\n' +
    '    proteoform TEXT NULL,\n' +
    '    FOREIGN KEY (scan_id)\n' +
    '       REFERENCES SPECTRA (ID)\n' +
    ');');
stmtCreateSequenceTable.run();
const insertMany = betterDB.transaction(importData);

var file = fs.readFileSync(myArgs[1], "utf-8");
file = findCSV(file);

insertMany(betterDB, file);

var stmtSeqIndex = betterDB.prepare("CREATE INDEX IF NOT EXISTS `sequence_index` ON `sequence` ( `scan_id` )");
stmtSeqIndex.run();
betterDB.close();

function importData(db, data) {
    var stmtFindScanID = db.prepare('SELECT ID AS id FROM SPECTRA WHERE SCAN = ?');
    var stmtInsert = db.prepare('INSERT INTO sequence(id,scan_id,protein_accession,proteoform) VALUES(?,?,?,?)');
    var stmtMaxSeqID = db.prepare('SELECT MAX(id) AS maxID FROM sequence');
    var id = stmtMaxSeqID.get().maxID + 1;
    Papa.parse(data, {
        complete: function(results) {
            //console.log("Finished:", results.data);
            results.data.forEach(row => {
                // console.log(row);
                //console.log('Scans:', row[4]);
                var scan = row[4];
                //console.log('Proteoform:', row[17]);
                var protein_accession = row[13];
                var proteoform = row[17];
                if(scan !== 'Scan(s)'){
                    var scan_id = stmtFindScanID.get(scan).id;
                    stmtInsert.run(id, scan_id,protein_accession, proteoform);
                    id++;
                }
            })
        }
    });
}

function findCSV(data) {
    data = data.substring(parameter.length+1);
    var indexBegin = data.indexOf(parameter) + parameter.length + 1;
    data = data.trim();
    return data.slice(indexBegin);
}