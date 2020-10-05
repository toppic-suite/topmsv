/**
 * Express router for /deleteMzrt
 *
 * Delete current feature information
 */
const express = require("express");
const router = express.Router();
const deleteFeature = require("../library/deleteFeature");

let deleteMzrt = router.get('/deleteMzrt', function (req,res) {
    let projectDir = req.query.projectDir;
    let projectCode = req.query.projectCode;
    deleteFeature(projectDir, projectCode);
    res.end();
});

module.exports = deleteMzrt;
