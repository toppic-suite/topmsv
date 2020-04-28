var express = require("express");
var router = express.Router();
var getScanLevel = require("../library/getScanLevel");

var scanlevel = router.get('/scanlevel', function (req, res) {
    console.log("Hello, scanlevel!");
    var projectDir = req.query.projectDir;
    var scanID = req.query.scanID;
    getScanLevel(projectDir, scanID, function (err, row) {
        let scanLevel = row.scanLevel.toString();
        res.write(scanLevel);
        res.end();
    })
});
module.exports = scanlevel;