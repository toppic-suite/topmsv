/**
 * Express router for /deleteMsalign
 *
 * Delete current envelope peaks
 */
const express = require("express");
const router = express.Router();
const deleteEnvPeak = require("../library/deleteEnvPeak");

let deleteMsalign = router.get('/deleteMsalign', function (req,res) {
    let projectDir = req.query.projectDir;
    let projectCode = req.query.projectCode;
    deleteEnvPeak(projectDir, projectCode);
    res.end();
});

module.exports = deleteMsalign;
