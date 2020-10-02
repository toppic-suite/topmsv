var express = require("express");
var router = express.Router();
var BetterDB = require("better-sqlite3");

var editManage = router.post('/editManage', function (req,res) {
    console.log("Hello, editManage!");
    const type = req.query.type;
    const id = req.query.id;
    const name = req.query.name;
    const description = req.query.description;
    const publicStatus = req.query.publicStatus;
    console.log("type", type);
    console.log("publicStatus", publicStatus);
    const resultDb = new BetterDB('./db/projectDB.db');
    if (type === 'pid') {
        let stmt = resultDb.prepare(`UPDATE Project
                SET pname = ?, description = ?, public = ?
                WHERE pid = ?`);
        let info = stmt.run(name, description, publicStatus, id);
    }
    if (type === 'eid') {
        let stmt = resultDb.prepare(`UPDATE Experiment
                SET ename = ?, description = ?, public = ?
                WHERE eid = ?`);
        let info = stmt.run(name, description, publicStatus, id);
    }
    if (type === 'datasetID') {
        let stmt = resultDb.prepare(`UPDATE Dataset
                SET dname = ?, description = ?, public = ?
                WHERE datasetID = ?`);
        let info = stmt.run(name, description, publicStatus, id);
    }
    resultDb.close();
    res.end();
});

module.exports = editManage;