"use strict";
const express = require("express");
const router = express.Router();
const getProjectSummary = require("../library/getProjectSummary");
const getAllSeq = require("../library/getAllSeq");
/**
 * Express router for /seqResults
 *
 * Query proteoform list by projectCode and
 * render a sequence list web page to users
 */
const seqResults = router.get('/seqResults', function (req, res) {
    console.log('Hello, seqResults');
    let projectCode = req.query.projectCode;
    getProjectSummary(projectCode, function (err, row) {
        if (row === undefined) {
            res.send("invalid project ID!");
            return;
        }
        let projectDir = row.projectDir;
        let envStatus = row.envelopeStatus;
        let seqStatus = row.sequenceStatus;
        if (seqStatus === 1 && envStatus === 1) {
            let results = getAllSeq(projectDir);
            if (!results) {
                res.send("sequence information could not be parsed!");
                return;
            }
            //format qVal and eVal
            results.forEach(prot => {
                if (prot.q_value != "N/A") {
                    prot.q_value = (parseFloat(prot.q_value).toExponential(2)).toString();
                }
                if (prot.e_value != "N/A") {
                    prot.e_value = (parseFloat(prot.e_value).toExponential(2)).toString();
                }
            });
            res.render('pages/sequence', {
                projectDir: projectDir,
                projectCode: projectCode,
                results: results
            });
        }
        else if (seqStatus === 1 && envStatus === 0) {
            let results = getAllSeq(projectDir);
            if (!results) {
                res.send("sequence information could not be parsed!");
                return;
            }
            //format qVal and eVal
            results.forEach(prot => {
                if (prot.q_value != "N/A") {
                    prot.q_value = (parseFloat(prot.q_value).toExponential(2)).toString();
                }
                if (prot.e_value != "N/A") {
                    prot.e_value = (parseFloat(prot.e_value).toExponential(2)).toString();
                }
            });
            res.render('pages/seqWithoutEnv', {
                projectDir: projectDir,
                projectCode: projectCode,
                results: results
            });
        }
        else {
            res.write("You haven't uploaded sequence data, please upload first to check your sequence result!");
            res.end();
        }
    });
});
module.exports = seqResults;
