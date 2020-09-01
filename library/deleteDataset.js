const BetterDB = require("better-sqlite3");

function deleteDataset(datasetID) {
    let resultDb = new BetterDB("./db/projectDB.db");
    let stmt = resultDb.prepare(`DELETE FROM Dataset WHERE datasetID = ?;`);
    let info = stmt.run(datasetID);
    resultDb.close();
}

module.exports = deleteDataset;