var express = require("express");
var router = express.Router();
const BetterDB = require("better-sqlite3");

var getInfo = router.get('/getInfo', function (req,res) {
    console.log("Hello, getInfo!");
    const uid = req.session.passport.user.profile.id;
    const type = req.query.type;
    const id = req.query.id;
    if (type === 'pid') {
        let resultDb = new BetterDB("./db/projectDB.db");
        let stmt = resultDb.prepare(`SELECT pid as pid, pname as projectName
                FROM Project
                WHERE pid = ?;`);
        let queryResult = stmt.get(id);
        resultDb.close();
        res.write(queryResult.projectName);
    }
    if (type === 'eid') {
        let resultDb = new BetterDB("./db/projectDB.db");
        let stmt = resultDb.prepare(`SELECT ename as ename
                FROM Experiment
                WHERE eid = ?;`);
        let queryResult = stmt.get(id);
        resultDb.close();
        res.write(queryResult.ename);
    }
    if (type === 'datasetID') {
        let resultDb = new BetterDB("./db/projectDB.db");
        let stmt = resultDb.prepare(`SELECT dname as dname
                FROM Dataset
                WHERE datasetID = ?;`);
        let queryResult = stmt.get(id);
        resultDb.close();
        res.write(queryResult.dname);
    }
    res.end();
});

module.exports = getInfo;