var express = require("express");
var router = express.Router();
var getEnvTable = require("../library/getEnvTable");

var envtable = router.get('/envtable', function (req, res) {
    console.log("Hello, envtable!");
    let projectDir = req.query.projectDir;
    let scanNum = req.query.scanID;
    /*getScanID(projectDir,scanNum,function (err, row) {
        let scanID;
        if(row !== undefined) {
            scanID = row.scanID;
        }

    })*/
    getEnvTable(projectDir, scanNum, function (err, rows) {
        //console.log("Env Table rows:", rows);
        if (rows !== undefined) {
            console.log(scanNum);
            console.log(rows);
            res.json(rows);
            //res.write(JSON.stringify(rows));
            res.end();
        }else {
            res.write("0");
            res.end();
        }
    });
});
module.exports = envtable;