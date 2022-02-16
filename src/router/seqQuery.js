"use strict";
const express = require("express");
const router = express.Router();
const getProjectSummary = require("../library/getProjectSummary");
const getProteoform = require("../library/getProteoform");
/**
 * Express router for /seqQuery
 *
 * Query proteoform by projectCode and scan,
 * send back proteoform result to user
 */
const seqQuery = router.get('/seqQuery', function (req, res) {
    let projectDir = req.query.projectDir;
    let projectCode = req.query.projectCode;
    let scanNum = req.query.scanID;
    getProjectSummary(projectCode, function (err, row) {
        if (!row) {
            res.write('0');
            res.end();
            return;
        }
        let seqStatus = row.sequenceStatus;
        if (seqStatus === 1) {
            let proteoform = getProteoform(projectDir, scanNum);
            if (proteoform !== 0) {
                //console.log(proteoform)
                res.write(JSON.stringify(proteoform));
                res.end();
            }
            else {
                res.write('0');
                res.end();
            }
        }
        else {
            res.write('0');
            res.end();
        }
    });
});
module.exports = seqQuery;
