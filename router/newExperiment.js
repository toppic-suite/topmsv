var express = require("express");
var router = express.Router();
var insertExperiment = require("../library/insertExperiment");


var newExperiment = router.post('/newExperiment', function (req,res) {
    console.log("Hello, newProject!");
    const uid = req.session.passport.user.profile.id;
    const ename = req.query.ename;
    const pid = req.query.pid;
    const description = req.query.description;
    const public = req.query.public;
    insertExperiment(ename, pid, description,public);
    res.end();
});

module.exports = newExperiment;