const express = require("express");
const router = express.Router();
const getProjectSummary = require("../library/getProjectSummary");

/**
 * Express router for /projectManagement
 *
 * Render project management page to user
 */
const projectManagement = router.get('/projectManagement', function (req, res) {
    if (req.session.passport === undefined){
        res.write("Please log in first!");
        res.end();
        return;
    }
    else {
        //console.log(req.session.passport.user.profile);
        const uid = req.session.passport.user.profile.id;
        const projectCode = req.query.projectCode;
        getProjectSummary(projectCode, function (err, row) {
            let projectName = row.projectName;
            let projectPublic = row.public;
            let projectDescription = row.description;
            let projectUid = row.uid;
            if(projectUid !== uid) {
                res.write("Please log in first!");
                res.end();
                return;
            }
            res.render('pages/projectManagement', {
                projectCode: projectCode,
                projectName: projectName,
                publicValue: projectPublic,
                description: projectDescription
            })
        });
    }
});
module.exports = projectManagement;