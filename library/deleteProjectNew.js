const BetterDB = require("better-sqlite3");

function deleteProject(pid) {
    let resultDb = new BetterDB("./db/projectDB.db");
    let stmt = resultDb.prepare(`DELETE FROM Project WHERE pid = ?;`);
    let info = stmt.run(pid);
    resultDb.close();
}

module.exports = deleteProject;