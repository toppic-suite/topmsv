var express = require("express");
var router = express.Router();
const BetterDB = require("better-sqlite3");

var getInfo = router.get('/getInfo', function (req,res) {
    console.log("Hello, getInfo!");
    // const uid = req.session.passport.user.profile.id;
    const type = req.query.type;
    const id = req.query.id;
    if (type === 'pid') {
        let resultDb = new BetterDB("./db/projectDB.db");
        let stmt = resultDb.prepare(`SELECT pid as pid, pname as projectName, description AS description, permission AS permission, password AS password
                FROM Project
                WHERE pid = ?;`);
        let queryResult = stmt.get(id);
        resultDb.close();
        res.write(JSON.stringify(queryResult));
    }
    if (type === 'eid') {
        let resultDb = new BetterDB("./db/projectDB.db");
        let stmt = resultDb.prepare(`SELECT ename as ename, description AS description
                FROM Experiment
                WHERE eid = ?;`);
        let queryResult = stmt.get(id);
        resultDb.close();
        res.write(JSON.stringify(queryResult));
    }
    if (type === 'datasetID') {
        let resultDb = new BetterDB("./db/projectDB.db");
        let stmt = resultDb.prepare(`SELECT Dataset.dname as dname, Dataset.description AS description, Projects.ProjectCode AS projectCode
                FROM Dataset INNER JOIN Projects ON Dataset.projectsID = Projects.ProjectID
                WHERE Dataset.datasetID = ?;`);
        let queryResult = stmt.get(id);
        resultDb.close();
        res.write(JSON.stringify(queryResult));
    }
    res.end();
});

module.exports = getInfo;