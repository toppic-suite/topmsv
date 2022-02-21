"use strict";
const express = require("express");
const router = express.Router();
const getScanID = require("../library/getScanID");
/**
 * Express.js router for /scanID
 *
 * Return scan number of specific scan by given scan ID
 */
const scanID = router.get('/scanID', function (req, res) {
    console.log("Hello, scanID!");
    const projectDir = req.query.projectDir;
    const id = req.query.ID;
    getScanID(projectDir, id, function (err, row) {
        if (!row) {
            res.write("0");
            res.end();
            return;
        }
        let scanID = row.scanID.toString();
        res.write(scanID);
        res.end();
    });
});
module.exports = scanID;
