var express = require("express");
var router = express.Router();
var getNextLevelOneScan = require("../library/getNextLevelOneScan");

var findNextLevelOneScan = router.get('/findNextLevelOneScan', function (req, res) {
    console.log("Hello, findNextLevelOneScan!");
    var projectDir = req.query.projectDir;
    var scan = req.query.scanID;
    getNextLevelOneScan(projectDir, scan, function (err, row) {
        if (row !== undefined) {
            res.write(row.scan.toString());
            res.end();
        }else {
            res.write("0");
            res.end();
        }
    });
});

module.exports = findNextLevelOneScan;