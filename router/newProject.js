const express = require("express");
const router = express.Router();
const insertProjectNew = require("../library/insertProjectNew");

/**
 * Express.js router for /newProject
 * Create a new project with given project's information
 */
const newProject = router.post('/newProject', function (req,res) {
    console.log("Hello, newProject!");
    const uid = req.session.passport.user.profile.id;
    const projectName = req.query.projectName;
    const description = req.query.projectDescription;
    const permission = req.query.permission;
    // console.log("permission", permission);
    const password = req.query.password;
    insertProjectNew(projectName, uid, description, permission, password);
    res.end();
});

module.exports = newProject;