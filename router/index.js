/**
 * Express router for main webpage
 *
 * Show all public projects in database to both guests and users
 */
var express = require("express");
var router = express.Router();
var getProjectsGuest = require("../library/getProjectGuest");

var index = router.get('/', function (req, res) {
    if (req.session.token) {
        res.cookie('token', req.session.token);
    }else {
        res.cookie('token', '');
    }
    getProjectsGuest(function (rows) {
        rows.forEach(row=>{
            if(row.envelopeFile === '0') row.envelopeFile = 'N/A';
            if(row.description === '') row.description = 'N/A';
            if(row.projectStatus === 0) {
                row.projectStatus = 'Projecessing';
            } else if(row.projectStatus === 1) {
                row.projectStatus = 'Success';
            } else if(row.projectStatus === 2) {
                row.projectStatus = 'Failed';
            } else if(row.projectStatus === 3) {
                row.projectStatus = 'Removed';
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
        });
        res.render('pages/home', {
            projects: rows
        });
    });
});

module.exports = index;