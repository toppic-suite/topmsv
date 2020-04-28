var express = require("express");
var router = express.Router();
var getPeakList = require("../library/getPeakList");

var peaklist = router.get('/peaklist', function(req, res) {
    console.log("Hello, peaklist!");
    //var projectCode = req.query.projectCode;
    var projectDir = req.query.projectDir;
    var scanID = req.query.scanID;
    getPeakList(projectDir, scanID, function (err, rows) {
        //console.log('test', calcDistrubution.emass(2654,2,rows));
        res.write(JSON.stringify(rows));
        res.end();
    })
});
module.exports = peaklist;