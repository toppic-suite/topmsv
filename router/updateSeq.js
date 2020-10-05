const express = require("express");
const router = express.Router();
const getProjectSummary = require("../library/getProjectSummary");
const updateSequence = require("../library/updateSequence");

/**
 * Express router for /updateSeq
 *
 * Handle request to update one proteoform in database by scan
 */
const updateSeq = router.post('/updateSeq', function (req, res) {
    console.log('Hello updateSeq!');
    let uid;
    //console.log(req.session.passport.user.profile);
    if (!req.session.passport) {
        res.write('Unauthorized');
        res.end();
        return;
    } else {
        uid = req.session.passport.user.profile.id;
    }
    let projectCode = req.query.projectCode;
    let scanNum = req.query.scanNum;
    let proteoform = req.query.proteoform;
    getProjectSummary(projectCode, function (err, row) {
        let seqStatus = row.sequenceStatus;
        let projectDir = row.projectDir;
        let projectUid = row.uid;
        if (projectUid !== uid) {
            res.write('Unauthorized');
            res.end();
            return;
        }
        if(seqStatus === 1) {
            try {
                updateSequence(projectDir, proteoform, scanNum);
                res.write('1');
                res.end();
            } catch (e) {
                console.log(e);
                res.write('0');
                res.end();
            }
        } else {
            res.write('0');
            res.end();
        }
    })
});

module.exports = updateSeq;