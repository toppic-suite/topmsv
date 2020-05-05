var express = require("express");
var router = express.Router();
var load3dDataLib = require("../library/load3dData");

var load3dData = router.get('/load3dData', function (req, res) {
    console.log("Hello, load3dData!");
    var projectDir = req.query.projectDir;
    load3dDataLib(projectDir, function (err, rows) {
        res.write(JSON.stringify(rows));
        console.log("rows", rows);
        res.end();
    });
});

module.exports = load3dData;