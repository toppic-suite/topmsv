var express = require("express");
var router = express.Router();
var getScanID = require("../library/getScanID");

var scanID = router.get('/scanID', function (req, res) {
    console.log("Hello, scanID!");
    var projectDir = req.query.projectDir;
    var id = req.query.ID;
    getScanID(projectDir, id, function (err, row) {
        let scanID = row.scanID.toString();
        res.write(scanID);
        res.end();
    })
});
module.exports = scanID;