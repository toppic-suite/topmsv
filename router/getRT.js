var express = require("express");
var router = express.Router();
var getRTAsync = require("../library/getRTAsync");

var getRT = router.get('/getRT', function (req, res) {
    console.log("Hello, getRT!");
    var projectDir = req.query.projectDir;
    var scanNum = req.query.scanID;
    getRTAsync(projectDir, scanNum, function (err, row) {
        res.write(row.rt.toString());
        res.end();
    })
});

module.exports = getRT;
