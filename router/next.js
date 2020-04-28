var express = require("express");
var router = express.Router();
var getNext = require("../library/getNext");

var next = router.get('/next', function(req, res) {
    console.log("Hello, next!");
    var projectDir = req.query.projectDir;
    var scanID = req.query.scanID;
    getNext(projectDir, scanID, function (err, row) {
        let nextID = row.next.toString();
        res.write(nextID);
        res.end();
    })
});
module.exports = next;