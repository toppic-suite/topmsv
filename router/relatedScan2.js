const express = require("express");
const router = express.Router();
const getRelatedScan2 = require("../library/getRelatedScan2");

/**
 * Express.js router for /relatedScan2
 * 
 * Return array of scan level two scans by given scan level one scan.
 */
const relatedScan2 = router.get('/relatedScan2', function (req, res) {
    console.log("Hello, relatedScan2!");
    let projectDir = req.query.projectDir;
    let scanID = req.query.scanID;
    // console.log("scanID:",scanID);
    getRelatedScan2(projectDir, scanID, function (err, row) {
         console.log("row:", row);
        if(row !== undefined) {
            let levelTwoScanID = row.LevelTwoScanID.toString();
            res.write(levelTwoScanID);
            res.end();
        } else {
            res.write("-1");
            res.end();
        }
    })
});

module.exports = relatedScan2;