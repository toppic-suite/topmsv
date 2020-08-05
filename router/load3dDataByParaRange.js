var express = require("express");
var router = express.Router();
var load3dDataByParaRangeLib = require("../library/load3dDataByParaRange");

var load3dDataByParaRange = router.get('/load3dDataByParaRange', function (req, res) {
    console.log("Hello, load3dDataByParaRange!");
    var projectDir = req.query.projectDir;
    var tableNum = req.query.tableNum;
    var minRT = req.query.minRT;
    var maxRT = req.query.maxRT;
    var minMZ = req.query.minMZ;
    var maxMZ = req.query.maxMZ;
    var curRT = req.query.curRT;
    load3dDataByParaRangeLib(projectDir, tableNum, minRT, maxRT, minMZ, maxMZ, curRT, function (err, rows) {
        res.write(JSON.stringify(rows));
        res.end();
   });
});

module.exports = load3dDataByParaRange;