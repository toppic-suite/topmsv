"use strict";
const express = require("express");
const router = express.Router();
const getScanLevel = require("../library/getScanLevel");
/**
 * Express.js router for /scanlevel
 *
 * Return scan level of specific scan.
 */
const scanlevel = router.get('/scanlevel', function (req, res) {
    console.log("Hello, scanlevel!");
    const projectDir = req.query.projectDir;
    const scanID = req.query.scanID;
    getScanLevel(projectDir, scanID, function (err, row) {
        if (!row) {
            res.write("0");
            res.end();
            return;
        }
        let scanLevel = row.scanLevel.toString();
        res.write(scanLevel);
        res.end();
    });
});
module.exports = scanlevel;
