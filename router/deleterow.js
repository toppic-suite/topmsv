/**
 * Express router for /deleterow
 *
 * Delete multiple envelopes by envelope_id
 */
const express = require("express");
const router = express.Router();
const deleteMultiEnvs = require("../library/deleteMultiEnvs");

let deleterow = router.get('/deleterow', function (req,res) {
    console.log("Hello, deleterow!");
    let projectDir = req.query.projectDir;
    let envelopeIDs = req.query.envList;
    deleteMultiEnvs(projectDir,envelopeIDs,function () {
        res.write(JSON.stringify(envelopeIDs));
        res.end();
    });
});

module.exports = deleterow;