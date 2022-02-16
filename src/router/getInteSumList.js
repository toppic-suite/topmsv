"use strict";
const express = require("express");
const router = express.Router();
const getSumList = require("../library/getSumList");
/**
 * Express.js router for /getInteSumList
 *
 * Return array of {intensity, retention time, scan number}
 */
let getInteSumList = router.get('/getInteSumList', function (req, res) {
    console.log("Hello, getInteSumList!");
    const projectDir = req.query.projectDir;
    getSumList(projectDir, function (err, rows) {
        res.write(JSON.stringify(rows));
        // console.log(rows);
        res.end();
    });
});
module.exports = getInteSumList;
