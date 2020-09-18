var express = require("express");
var router = express.Router();
var getRelatedScan2 = require("../library/getRelatedScan2");

var relatedScan2 = router.get('/relatedScan2', function (req, res) {
    console.log("Hello, relatedScan2!");
    let projectDir = req.query.projectDir;
    let scanID = req.query.scanID;
    // console.log("scanID:",scanID);
    getRelatedScan2(projectDir, scanID, function (err, row) {
        // console.log("row:", row);
        let levelOneScanID = row.LevelOneScanID.toString();
        res.write(levelOneScanID);
        res.end();
    })
});

module.exports = relatedScan2;