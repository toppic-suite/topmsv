var express = require("express");
var router = express.Router();
var load3dDataByScanLib = require("../library/load3dDataByScan");

var load3dDataByScan = router.get('/load3dDataByScan', function (req, res) {
    console.log("Hello, load3dDataByScan!");
    var projectDir = req.query.projectDir;
    var scanNum = req.query.scanID;
    load3dDataByScanLib(projectDir, scanNum, function (err, rows) {
		console.log("rows count: ", rows.length)
        res.write(JSON.stringify(rows));
        res.end();
   });
});

module.exports = load3dDataByScan;