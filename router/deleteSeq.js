/**
 * Express router for /deleteSeq
 *
 * Delete current sequence information
 */
var express = require("express");
var router = express.Router();
var deleteSeqSync = require("../library/deleteSeqSync");
var updateSeqStatusSync = require("../library/updateSeqStatusSync");

var deleteSeq = router.get('/deleteSeq', function (req,res) {
    let projectDir = req.query.projectDir;
    let projectCode = req.query.projectCode;
    deleteSeqSync(projectDir,projectCode);
    updateSeqStatusSync(0,projectCode);
    res.end();
    /*deleteSeq(projectDir, projectCode, function () {
        updateSeqStatus(db,0, projectCode, function () {
            res.end();
        });
    });*/
});

module.exports = deleteSeq;