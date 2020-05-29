/**
 * Express router for /editProject
 *
 * Edit projectName, projectDescription, projectPublicStatus by projectCode
 */
var express = require("express");
var router = express.Router();
var insertProjectNew = require("../library/insertProjectNew");


var newProject = router.post('/newProject', function (req,res) {
    console.log("Hello, newProject!");
    const uid = req.session.passport.user.profile.id;
    const projectName = req.query.projectName;
    insertProjectNew(projectName, uid);
    res.end();
});

module.exports = newProject;