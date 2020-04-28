/**
 * Express router for /deleteMsalign
 *
 * Delete current envelope peaks
 */
var express = require("express");
var router = express.Router();
var deleteEnvPeak = require("../library/deleteEnvPeak");

var deleteMsalign = router.get('/deleteMsalign', function (req,res) {
    let projectDir = req.query.projectDir;
    let projectCode = req.query.projectCode;
    deleteEnvPeak(projectDir, projectCode);
    res.end();
});

module.exports = deleteMsalign;
