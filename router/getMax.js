//get minimum maximum value of rt and m/z for this mzML file

var express = require("express");
var router = express.Router();
var getMaxLib = require("../library/getMax");

var getMax = router.get('/getMax', function (req, res) {
    console.log("Hello, getMax!");
    var projectDir = req.query.projectDir;
    var columnName = req.query.colName;
    getMaxLib(projectDir, columnName, function (err, row) {
        res.write(row[Object.keys(row)[0]].toString())
        res.end();
    })
});

module.exports = getMax;