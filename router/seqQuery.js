/**
 * Express router for /seqQuery
 *
 * Query proteoform by projectCode and scan,
 * send back proteoform result to user
 */
var express = require("express");
var router = express.Router();
var getProjectSummary = require("../library/getProjectSummary");
var getProteoform = require("../library/getProteoform");

var seqQuery = router.get('/seqQuery', function (req, res) {
    let projectDir = req.query.projectDir;
    let projectCode = req.query.projectCode;
    let scanNum = req.query.scanID;
    getProjectSummary(projectCode,function (err,row) {
        let seqStatus = row.sequenceStatus;
        if(seqStatus === 1) {
            let proteoform = getProteoform(projectDir, scanNum);
            //console.log(proteoform);
            if (proteoform !== 0) {
                res.write(proteoform);
                res.end();
            } else {
                res.write('0');
                res.end();
            }
        } else {
            res.write('0');
            res.end();
        }
    });
});

module.exports = seqQuery;