/**
 * Express router for /editProject
 *
 * Edit projectName, projectDescription, projectPublicStatus by projectCode
 */
var express = require("express");
var router = express.Router();
var insertExperiment = require("../library/insertExperiment");


var newProject = router.post('/newProject', function (req,res) {
    console.log("Hello, newProject!");
    const uid = req.session.passport.user.profile.id;
    const ename = req.query.ename;
    const pid = req.query.pid;
    insertExperiment(ename, pid);
    res.end();
});

module.exports = newProject;