var express = require("express");
var router = express.Router();
const getProjectNew = require("../library/getProjectNew");
const getExperiment = require("../library/getExperiment");
var createDataset = router.get('/createDataset', function (req,res) {
    //console.log('Cookies: ', req.cookies);
    //console.log('Session:', req.session);
    //console.log(req.session.passport.user.profile);
    //console.log(req.session);
    //let uid = req.session.passport.user.profile.uid;
    console.log("hello createDataset");
    if (req.session.passport === undefined)
        res.render('pages/projects', {
            projects: []
        });
    else {
        //console.log(req.session.passport.user.profile);
        let uid = req.session.passport.user.profile.id;
        let pid = req.query.pid;
        // console.log(pid);

        let projectList = getProjectNew(uid);
        let experimentList = getExperiment(uid, projectList[0].pid);
        console.log("projectList", projectList);
        res.render('pages/createDataset', {
            info: uid,
            projectList: projectList
        });
    }
});

module.exports = createDataset;