var express = require("express");
var router = express.Router();
var insertProjectNew = require("../library/insertProjectNew");


var newProject = router.post('/newProject', function (req,res) {
    console.log("Hello, newProject!");
    const uid = req.session.passport.user.profile.id;
    const projectName = req.query.projectName;
    const description = req.query.projectDescription;
    const permission = req.query.permission;
    console.log("permission", permission);
    const password = req.query.password;
    insertProjectNew(projectName, uid, description, permission, password);
    res.end();
});

module.exports = newProject;