var express = require("express");
var router = express.Router();
var load3dDataByParaRangeLib = require("../library/load3dDataByParaRange");

var load3dDataByParaRange = router.get('/load3dDataByParaRange', function (req, res) {
    console.log("Hello, load3dDataByParaRange!");
    var projectDir = req.query.projectDir;
    var minRT = req.query.minRT;
    var maxRT = req.query.maxRT;
    var minMZ = req.query.minMZ;
    var maxMZ = req.query.maxMZ;
    load3dDataByParaRangeLib(projectDir, minRT, maxRT, minMZ, maxMZ, function (err, rows) {
        res.write(JSON.stringify(rows));
        res.end();
   });
});

module.exports = load3dDataByParaRange;