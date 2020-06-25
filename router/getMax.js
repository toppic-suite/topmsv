//get minimum maximum value of rt and m/z for this mzML file

var express = require("express");
var router = express.Router();
var getMaxLib = require("../library/getMax");

var getMax = router.get('/getMax', function (req, res) {
    console.log("Hello, getMax!");
    var projectDir = req.query.projectDir;
    getMaxLib(projectDir, function (err, row) {
        res.write(JSON.stringify(row));
        res.end();
    })
});

module.exports = getMax;