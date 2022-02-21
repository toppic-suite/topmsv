"use strict";
/**
 * Express router for /editProject
 *
 * Edit projectName, projectDescription, projectPublicStatus by projectCode
 */
const express = require("express");
const router = express.Router();
const updateProjectNameSync = require("../library/updateProjectNameSync");
const updateDescriptionSync = require("../library/updateDescriptionSync");
const updatePublicStatusSync = require("../library/updatePublicStatusSync");
let editProject = router.post('/editProject', function (req, res) {
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
