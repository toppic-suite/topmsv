var express = require("express");
var router = express.Router();
var getPrev = require("../library/getPrev");

var prev = router.get('/prev', function(req, res) {
    console.log("Hello, prev!");
    var projectDir = req.query.projectDir;
    var scanID = req.query.scanID;
    getPrev(projectDir, scanID, function (err, row) {
        let prevID = row.prev.toString();
        res.write(prevID);
        res.end();
    })
});
module.exports = prev;