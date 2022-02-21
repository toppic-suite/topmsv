"use strict";
/**
 * Express router for /deleteSeq
 *
 * Delete current sequence information
 */
const express = require("express");
const router = express.Router();
const deleteSeqSync = require("../library/deleteSeqSync");
const updateSeqStatusSync = require("../library/updateSeqStatusSync");
const deleteSeqFile = require("../library/deleteSeqFile");
let deleteSeq = router.get('/deleteSeq', function (req, res) {
    let projectDir = req.query.projectDir;
    let projectCode = req.query.projectCode;
    deleteSeqSync(projectDir, projectCode);
    deleteSeqFile(projectDir);
    updateSeqStatusSync(0, projectCode);
    res.end();
});
module.exports = deleteSeq;
