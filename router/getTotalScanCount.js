/*getTotalScanCount.js: get total number of scans in the mzML file*/

const express = require("express");
const router = express.Router();
const getTotalScanCountLib = require("../library/getTotalScanCount");

/**
 * Express.js router for /getTotalScanCount
 * 
 * Return total number of scans
 */
const getTotalScanCount = router.get('/getTotalScanCount', function (req,res) {
    console.log("Hello, getTotalScanCount!");
    const projectDir = req.query.projectDir;

    getTotalScanCountLib(projectDir, function (err, row) {
        if(!row) {
            res.write('0');
        }else{
            res.write(JSON.stringify(row));
        }
        res.end();
    })
});

module.exports = getTotalScanCount;
