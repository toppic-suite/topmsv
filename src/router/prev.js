"use strict";
const express = require("express");
const router = express.Router();
const getPrev = require("../library/getPrev");
/**
 * Express.js router for /prev
 * Return previous scan number of given scan
 */
const prev = router.get('/prev', function (req, res) {
    console.log("Hello, prev!");
    const projectDir = req.query.projectDir;
    const scanID = req.query.scanID;
    getPrev(projectDir, scanID, function (err, row) {
        if (!row) {
            res.write("0");
            res.end();
            return;
        }
        let prevID = row.prev.toString();
        res.write(prevID);
        res.end();
    });
});
module.exports = prev;
