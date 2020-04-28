/**
 * Express router for /deleterow
 *
 * Delete multiple envelopes by envelope_id
 */
var express = require("express");
var router = express.Router();
var deleteMultiEnvs = require("../library/deleteMultiEnvs");

var deleterow = router.get('/deleterow', function (req,res) {
    console.log("Hello, deleterow!");
    let projectDir = req.query.projectDir;
    let envelopeIDs = req.query.envList;
    // console.log(envelopeIDs);
    deleteMultiEnvs(projectDir,envelopeIDs,function () {
        res.end();
    });
});

module.exports = deleterow;