var express = require("express");
var router = express.Router();
var getPrecMZ = require("../library/getPrecMZ");

var precMZ = router.get('/precMZ', function (req, res) {
    console.log("Hello, precMZ!");
    var projectDir = req.query.projectDir;
    var scanID = req.query.scanID;
    getPrecMZ(projectDir, scanID, function (err, row) {
        let precMZ = row.precMZ.toString();
        res.write(precMZ);
        res.end();
    })
});

module.exports = precMZ;