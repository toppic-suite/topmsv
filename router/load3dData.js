var express = require("express");
var router = express.Router();
var getNextLevelOneScan = require("../library/load3dData");

var load3dData = router.get('/load3dData', function (req, res) {
    console.log("Hello, load3dData!");
    var projectDir = req.query.projectDir;

    load3dData(projectDir, function (err, row) {
        if (row !== undefined) {
            res.write(row.scan.toString());
            res.end();
        }else {
            res.write("0");
            res.end();
        }
    });
});

module.exports = load3dData;