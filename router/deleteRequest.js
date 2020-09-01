var express = require("express");
var router = express.Router();
const deleteDataset = require("../library/deleteDataset");
const deleteExperiment = require("../library/deleteExperiment");
const deleteProject = require("../library/deleteProjectNew");

var deleteRequest = router.post('/deleteRequest', function (req,res) {
    //console.log('Cookies: ', req.cookies);
    //console.log('Session:', req.session);
    //console.log(req.session.passport.user.profile);
    //console.log(req.session);
    //let uid = req.session.passport.user.profile.uid;
    console.log("hello deleteRequest");
    if (req.session.passport === undefined)
    {
        console.log("no passport");
        res.end();
    }
    else {
        //console.log(req.session.passport.user.profile);
        let uid = req.session.passport.user.profile.id;
        let type = req.query.type;
        let id = req.query.id;
        // console.log(pid);

        if (type === 'datasetID') {
            deleteDataset(id);
            res.end();
        }

        if (type === 'eid') {
            deleteExperiment(id);
            res.end();
        }

        if (type === 'pid') {
            deleteProject(id);
            res.end();
        }
    }
});

module.exports = deleteRequest;