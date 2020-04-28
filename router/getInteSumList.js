var express = require("express");
var router = express.Router();
var getSumList = require("../library/getSumList");

var getInteSumList = router.get('/getInteSumList', function (req, res) {
    console.log("Hello, getInteSumList!");
    var projectDir = req.query.projectDir;
    getSumList(projectDir, function (err, rows) {
        res.write(JSON.stringify(rows));
        // console.log(rows);
        res.end();
    })
});

module.exports = getInteSumList;