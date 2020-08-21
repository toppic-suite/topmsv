var express = require("express");
var router = express.Router();
var load3dDataByRTLib = require("../library/load3dDataByRT");

var load3dDataByRT = router.get('/load3dDataByRT', function (req, res) {
    console.log("Hello, load3dDataByRT!");
    var projectDir = req.query.projectDir;
    var rt = req.query.RT;
    var tableNum = req.query.tableNum
    var minMZ = req.query.minMZ;
    var maxMZ = req.query.maxMZ;
    load3dDataByRTLib(projectDir, rt, tableNum, minMZ, maxMZ, function (err, rows) {
        res.write(JSON.stringify(rows));
        res.end();
   });
});

module.exports = load3dDataByRT;