//get minimum maximum value of rt and m/z for this mzML file

var express = require("express");
var router = express.Router();
var getPeaksPerTableLib = require("../library/getPeaksPerTable");

var getPeaksPerTable = router.get('/getPeaksPerTable', function (req, res) {
    console.log("Hello, getPeaksPerTable!");
    var projectDir = req.query.projectDir;
    var layerCount = req.query.layerCount;
    getPeaksPerTableLib(projectDir, layerCount, function (err, row) {
        //console.log(typeof(row));
        res.write(JSON.stringify(row));
        res.end();
    })
});

module.exports = getPeaksPerTable;