var express = require("express");
var router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const getProjects = require("../library/getProjects");

var projects = router.get('/projects', function (req,res) {
    //console.log('Cookies: ', req.cookies);
    //console.log('Session:', req.session);
    //console.log(req.session.passport.user.profile);
    //console.log(req.session);
    //let uid = req.session.passport.user.profile.uid;
    console.log("hello projects");
    if (req.session.passport === undefined)
        res.render('pages/projects', {
            projects: []
        });
    else {
        //console.log(req.session.passport.user.profile);
        let uid = req.session.passport.user.profile.id;
        console.log(uid);
        getProjects(uid,function (rows) {
            rows.forEach(row=>{
                if(row.envelopeFile === '0') row.envelopeFile = 'N/A';
                if(row.description === '') row.description = 'N/A';
                if(row.projectStatus === 0) {
                    row.projectStatus = 'Processing';
                } else if(row.projectStatus === 1) {
                    row.projectStatus = 'Success';
                } else if(row.projectStatus === 2) {
                    row.projectStatus = 'Failed';
                } else if(row.projectStatus === 3) {
                    row.projectStatus = 'Removed';
                } else if(row.projectStatus ===4) {
                    row.projectStatus = 'Waiting';
                }
                if(row.envStatus === 1) {
                    row.envStatus = 'Yes';
                } else {
                    row.envStatus = 'No';
                }
				if(row.featureStatus === 1) {
                    row.featureStatus = 'Yes';
                } else {
                    row.featureStatus = 'No';
                }
                if(row.seqStatus === 1) {
                    row.seqStatus = 'Yes';
                } else {
                    row.seqStatus = 'No';
                }
                row.projectLink = '/data?id=' + row.projectCode;
                row.editLink = '/projectManagement?projectCode=' + row.projectCode;
            });
            res.render('pages/projects', {
                projects: rows
            });
        });
    }
});

module.exports = projects;