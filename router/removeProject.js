/**
 * Express router for /removeProject
 *
 * Remove project by projectCode
 */
var express = require("express");
var router = express.Router();
var getProjectSummary = require("../library/getProjectSummary");
var deleteProject = require("../library/deleteProject");

var removeProject = router.post('/removeProject', function (req, res) {
    console.log("Hello, removeProject!");
    const projectCode = req.query.projectCode;
    getProjectSummary(projectCode, function (err, row) {
        let projectStatus = row.projectStatus;
        if (projectStatus === 3) {
            res.end();
            return;
        } else {
            deleteProject(projectCode);
            res.end();
        }
    });
});

module.exports = removeProject;