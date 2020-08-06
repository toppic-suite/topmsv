/**
 * Express router for /deleteMzrt
 *
 * Delete current feature information
 */
var express = require("express");
var router = express.Router();
var deleteFeature = require("../library/deleteFeature");

var deleteMzrt = router.get('/deleteMzrt', function (req,res) {
    let projectDir = req.query.projectDir;
    let projectCode = req.query.projectCode;
    deleteFeature(projectDir, projectCode);
    res.end();
});

module.exports = deleteMzrt;
