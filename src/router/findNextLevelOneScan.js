"use strict";
const express = require("express");
const router = express.Router();
const getNextLevelOneScan = require("../library/getNextLevelOneScan");
/**
 * Express.js router for /findNextLevelOneScan
 * Return scan number of next level one scan with given scan number.
 */
let findNextLevelOneScan = router.get('/findNextLevelOneScan', function (req, res) {
    console.log("Hello, findNextLevelOneScan!");
    const projectDir = req.query.projectDir;
    const scan = req.query.scanID;
    getNextLevelOneScan(projectDir, scan, function (err, row) {
        if (row !== undefined) {
            res.write(row.scan.toString());
            res.end();
        }
        else {
            res.write("0");
            res.end();
        }
    });
});
module.exports = findNextLevelOneScan;
