const express = require("express");
const router = express.Router();
const getProjectSummary = require("../library/getProjectSummary");
const deleteProject = require("../library/deleteProject");

/**
 * Express router for /removeProject
 *
 * Remove project by projectCode
 */
const removeProject = router.post('/removeProject', function (req, res) {
    console.log("Hello, removeProject!");
    const projectCode = req.query.projectCode;
    deleteProject(projectCode);
    res.end();
});

module.exports = removeProject;