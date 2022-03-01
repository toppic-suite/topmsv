"use strict";
const express = require("express");
const router = express.Router();
const BetterDB = require("better-sqlite3");
/**
 * Express.js router for /getExperimentList
 *
 * Return array of all experiments with given project id
 */
let getExperimentList = router.get('/getExperimentList', function (req, res) {
    console.log("Hello, getExperimentList!");
    const uid = req.session.passport.user.profile.id;
    const pid = req.query.pid;
    let resultDb = new BetterDB("./db/projectDB.db");
    let stmt = resultDb.prepare(`SELECT eid AS eid, ename AS ename FROM Experiment WHERE pid = ?;`);
    let queryResult = stmt.all(pid);
    resultDb.close();
    // console.log(queryResult);
    res.write(JSON.stringify(queryResult));
    res.end();
});
module.exports = getExperimentList;
