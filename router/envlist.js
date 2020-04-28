var express = require("express");
var router = express.Router();
var getProjectSummary = require("../library/getProjectSummary");
const ifEnvExists = require("../library/ifEnvExists");
const showData = require("../library/showData");
const sqlite3 = require('sqlite3').verbose();

var envlist = router.get('/envlist', function(req, res) {
    console.log("Hello, envlist!");
    let projectDir = req.query.projectDir;
    let scanid = req.query.scanID;
    let projectCode = req.query.projectCode;
    //console.log(scanid);
    getProjectSummary(projectCode, function (err, row) {

    })
    let dbDir = projectDir.substr(0, projectDir.lastIndexOf(".")) + ".db";
    let resultDb = new sqlite3.Database(dbDir, (err) => {
        if (err) {
            console.error(err.message);
        }
        // console.log('Connected to the result database.');
    });
    ifEnvExists(projectCode,(err, row)=> {
        if(row.EnvelopeStatus === 1) {
            showData(resultDb,scanid,res);
        }else {
            res.write('0');
            res.end();
        }
    })
});
module.exports = envlist;