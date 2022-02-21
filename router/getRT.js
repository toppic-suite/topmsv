"use strict";
const express = require("express");
const router = express.Router();
const getRTAsync = require("../library/getRTAsync");
/**
 * Express.js router for /getRT
 *
 * Return retention time of one scan by given scan number
 */
const getRT = router.get('/getRT', function (req, res) {
    console.log("Hello, getRT!");
    const projectDir = req.query.projectDir;
    const scanNum = req.query.scanID;
    getRTAsync(projectDir, scanNum, function (err, row) {
        if (!row) {
            res.write('0');
            res.end();
            return;
        }
        res.write(row.rt.toString());
        res.end();
    });
});
module.exports = getRT;
