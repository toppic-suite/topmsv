var express = require("express");
var router = express.Router();
var loadMzrtDataLib = require("../library/loadMzrtData");

var loadMzrtData = router.get('/loadMzrtData', function (req, res) {
    console.log("Hello, loadMzrtData!");
    var projectDir = req.query.projectDir;
    var minRT = req.query.minRT;
    var maxRT = req.query.maxRT;
    var minMZ = req.query.minMZ;
    var maxMZ = req.query.maxMZ;
    loadMzrtDataLib(projectDir, minRT, maxRT, minMZ, maxMZ, function (err, rows) {
        res.write(JSON.stringify(rows));
        res.end();
   });
});

module.exports = loadMzrtData;