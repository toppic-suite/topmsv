/**
 * Express router for /data
 *
 * Check project status and render result page back to users
 */
var express = require("express");
var router = express.Router();
var getProjectSummary = require("../library/getProjectSummary");
var getScanRange = require("../library/getScanRange");

var data = router.get('/data', function(req, res) {
    console.log("Hello data!");
    var projectCode = req.query.id;
    let uid = 0;
    if (req.session.passport === undefined)
    {
        //console.log('No user auth!');
    }
    else {
        //console.log(req.session.passport.user.profile);
        uid = req.session.passport.user.profile.id;
        /*console.log(typeof uid);
        console.log('uid', uid);*/
    }


    getProjectSummary(projectCode, function (err, row) {
        let summary;
        if (err) {
            console.log(err);
        } else {
            // console.log(row.projectStatus);
            if(row === undefined) {
                res.send("No such project, please check your link.");
                res.end();
            } else {
                //console.log(row);
                if (row.projectStatus === 1) {
                    summary = {
                        ProjectName: row.projectName,
                        ProjectStatus: row.projectStatus,
                        EmailAddress: row.email,
                        MS1_envelope_file: row.ms1_envelope_file,
                        envStatus: row.envelopeStatus,
						featureStatus: row.featureStatus
                    };
                    //console.log(summary);
                    let projectDir = row.projectDir;
                    let projectUid = row.uid;
                    var fileName = row.fileName;
                    //console.log(projectUid);
                    //res.write(JSON.stringify(summary));
                    //console.log(row.projectDir);
                    if(uid === projectUid) {
                        getScanRange(projectDir, function (err, row) {
                            let scanRange = {
                                MIN: row.minScan,
                                MAX: row.maxScan
                            };
                            //res.write(JSON.stringify(scanRange));
                            //console.log(projectDir);
                            res.render('pages/result', {
                                summary,
                                scanRange,
                                projectCode,
                                projectDir,
                                fileName
                            });
                        })
                    } else {
                        getScanRange(projectDir, function (err, row) {
                            let scanRange = {
                                MIN: row.minScan,
                                MAX: row.maxScan
                            };
                            //res.write(JSON.stringify(scanRange));
                            //console.log(projectDir);
                            res.render('pages/guestResult', {
                                summary,
                                scanRange,
                                projectCode,
                                projectDir,
                                fileName
                            });
                        });
                        /*res.send('You are not the owner of this project');
                        res.end();*/
                    }
                } else if (row.projectStatus === 0) {
                    console.log("Project status: 0");
                    res.send("Your project is processing, please wait for result.");
                    res.end();
                } else if (row.projectStatus === 2) {
                    console.log("Project status: 2");
                    res.send("Your project failed.");
                    res.end();
                } else if (row.projectStatus === 3) {
                    console.log("Project status: 3");
                    res.send("Your project has been removed.");
                    res.end();
                } else if (row.projectStatus === 4) {
                    console.log("Project status: 4");
                    res.send("Your project is on the task wait list, please wait for result!");
                    res.end();
                }
            }
        }
    });
});

module.exports = data;