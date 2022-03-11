const fs = require('fs');
const Database = require('better-sqlite3');
const myArgs = process.argv.slice(2);
// console.log("myArgs", myArgs);
const betterDB = new Database(myArgs[0]);
const stmtCreateSpectraTable = betterDB.prepare('CREATE TABLE IF NOT EXISTS `SPECTRA` (\n' +
    '\t`ID`\tINTEGER NOT NULL DEFAULT 1,\n' +
    '\t`SCAN`\tINTEGER NOT NULL DEFAULT 1,\n' +
    '\t`RETENTIONTIME`\tREAL NOT NULL DEFAULT 0,\n' +
    '\t`SCANLEVEL`\tINTEGER NOT NULL DEFAULT 1,\n' +
    '\t`PREC_MZ`\tREAL NOT NULL DEFAULT 0,\n' +
    '\t`PREC_CHARGE`\tINTEGER NOT NULL DEFAULT 0,\n' +
    '\t`PREC_INTE`\tREAL NOT NULL DEFAULT 0,\n' +
    '\t`PEAKSINTESUM`\tREAL DEFAULT 0,\n' +
    '\t`NEXT`\tINTEGER NOT NULL DEFAULT 0,\n' +
    '\t`PREV`\tINTEGER NOT NULL DEFAULT 0,\n' +
    '\tPRIMARY KEY(`ID`)\n' +
    ');');
stmtCreateSpectraTable.run();
const stmtCreatePeaksTable = betterDB.prepare('CREATE TABLE IF NOT EXISTS `PEAKS` (\n' +
    '\t`id`\tINTEGER,\n' +
    '\t`mz`\tREAL,\n' +
    '\t`intensity`\tREAL,\n' +
    '\t`SPECTRAID`\tINTEGER NOT NULL DEFAULT 1,\n' +
    '\tPRIMARY KEY(`id`),\n' +
    '\tFOREIGN KEY(`SPECTRAID`) REFERENCES `SPECTRA`(`ID`)\n' +
    ');');
stmtCreatePeaksTable.run();
fs.readFile(myArgs[1], ((err, data) => {
    if (err)
        throw err;
    insertMany(betterDB, data.toString());
    betterDB.close();
}));
const insertMany = betterDB.transaction(importData);
function importData(database, data) {
    const stmtInsertPeaks = database.prepare('INSERT INTO PEAKS(id,mz,intensity) VALUES(?,?,?)');
    const stmtMaxID = database.prepare('SELECT MAX(id) AS maxPeakID FROM PEAKS');
    const stmtCurrentSum = database.prepare('SELECT PEAKSINTESUM AS inteSum FROM SPECTRA WHERE ID = ?');
    // const stmtInsertSpectra = database.prepare('INSERT INTO SPECTRA(ID,SCAN,RETENTIONTIME,SCANLEVEL,PREC_MZ,PREC_CHARGE,PREC_INTE,PEAKSINTESUM,NEXT,PREV) VALUES(?,?,?,?,?,?,?,?,?,?)');
    // stmtInsertSpectra.run(1,1,0,1,0,1,0,0,0,0);
    let curInteSum = stmtCurrentSum.get(1).inteSum;
    let id = parseInt(stmtMaxID.get().maxPeakID) + 1;
    let intensitySum = parseFloat(curInteSum);
    let lines = data.split("\n");
    lines.forEach((element) => {
        // console.log("id", id);
        let mz = parseFloat(element.split(" ")[0]);
        let inte = parseFloat(element.split(" ")[1]);
        intensitySum += inte;
        stmtInsertPeaks.run(id, mz, inte);
        id++;
    });
    const stmtUpdateInteSum = database.prepare('UPDATE SPECTRA SET PEAKSINTESUM = ? WHERE ID = ?;');
    stmtUpdateInteSum.run(intensitySum, 1);
}
