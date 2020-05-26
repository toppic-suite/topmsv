var express = require("express");
var router = express.Router();
var load3dDataByRtRangeLib = require("../library/load3dDataByRtRange");

var load3dDataByRtRange = router.get('/load3dDataByRtRange', function (req, res) {
    console.log("Hello, load3dDataByRtRange!");
    var projectDir = req.query.projectDir;
    var minRT = req.query.minRT;
    var maxRT = req.query.maxRT;
    load3dDataByRtRangeLib(projectDir, minRT, maxRT, function (err, rows) {
		console.log("rows count: ", rows.length)
        res.write(JSON.stringify(rows));
        res.end();
   });
});

module.exports = load3dDataByRtRange;