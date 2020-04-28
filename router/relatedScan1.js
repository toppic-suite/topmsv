var express = require("express");
var router = express.Router();
var getRelatedScan1 = require("../library/getRelatedScan1");

var relatedScan1 = router.get('/relatedScan1', function (req, res) {
    console.log("Hello, relatedScan1!");
    var projectDir = req.query.projectDir;
    var scanID = req.query.scanID;
    getRelatedScan1(projectDir, scanID, function (err, row) {
        if(row !== undefined) {
            let levelTwoScanID = row.LevelTwoScanID.toString();
            res.write(levelTwoScanID);
            res.end();
        }else {
            res.write("0");
            res.end();
        }
    })
});

module.exports = relatedScan1;
