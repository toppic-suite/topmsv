const express = require("express");
const router = express.Router();
const getPeakList = require("../library/getPeakList");

/**
 * Express.js router for /peaklist
 * Return array of peaks corresponding to given scan number
 */
const peaklist = router.get('/peaklist', function(req, res) {
    console.log("Hello, peaklist!");
    //const projectCode = req.query.projectCode;
    const projectDir = req.query.projectDir;
    const scanID = req.query.scanID;
    getPeakList(projectDir, scanID, function (err, rows) {
        res.write(JSON.stringify(rows));
        res.end();
    })
});
module.exports = peaklist;