/**
 * Express router for /editProject
 *
 * Edit projectName, projectDescription, projectPublicStatus by projectCode
 */
var express = require("express");
var router = express.Router();
var updateProjectNameSync = require("../library/updateProjectNameSync");
var updateDescriptionSync = require("../library/updateDescriptionSync");
var updatePublicStatusSync = require("../library/updatePublicStatusSync");


var editProject = router.post('/editProject', function (req,res) {
    console.log("Hello, editProject!");
    const projectCode = req.query.projectCode;
    const projectName = req.query.projectName;
    const description = req.query.description;
    const publicStatus = req.query.publicStatus;
    updateProjectNameSync(projectName, projectCode);
    updateDescriptionSync(description, projectCode);
    updatePublicStatusSync(publicStatus, projectCode);
    res.end();
});

module.exports = editProject;