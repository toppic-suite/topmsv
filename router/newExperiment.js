const express = require("express");
const router = express.Router();
const insertExperiment = require("../library/insertExperiment");

/**
 * Express.js router for /newExperiment
 * 
 * Create a new experiment under specific project with given experiment information
 */
const newExperiment = router.post('/newExperiment', function (req,res) {
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