var express = require("express");
var router = express.Router();
var getScanLevelTwoList = require("../library/getScanLevelTwoList");

var scanTwoList = router.get('/scanTwoList', function (req, res) {
    console.log("Hello, scanTwoList!");
    var projectDir = req.query.projectDir;
    var scanID = req.query.scanID;
    getScanLevelTwoList(projectDir, scanID, function (err, rows) {
        res.write(JSON.stringify(rows));
        // console.log(rows);
        res.end();
    })
});
module.exports = scanTwoList;