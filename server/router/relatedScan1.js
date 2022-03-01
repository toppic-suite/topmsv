"use strict";
const express = require("express");
const router = express.Router();
const getRelatedScan1 = require("../library/getRelatedScan1");
/**
 * Express.js router for /relatedScan1
 *
 * Return scan level one of specific scan level two
 */
const relatedScan1 = router.get('/relatedScan1', function (req, res) {
    console.log("Hello, relatedScan1!");
    const projectDir = req.query.projectDir;
    const scanID = req.query.scanID;
    getRelatedScan1(projectDir, scanID, function (err, row) {
        if (row !== undefined) {
            let levelOneScanID = row.LevelOneScanID.toString();
            res.write(levelOneScanID);
            res.end();
        }
        else {
            res.write("-1");
            res.end();
        }
    });
});
module.exports = relatedScan1;
