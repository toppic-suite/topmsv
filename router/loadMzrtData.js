const express = require("express");
const router = express.Router();
const loadMzrtDataLib = require("../library/loadMzrtData");

/**
 * Express.js router for /loadMzrtData
 */
const loadMzrtData = router.get('/loadMzrtData', function (req, res) {
    console.log("Hello, loadMzrtData!");
    const projectDir = req.query.projectDir;
    const minRT = req.query.minRT;
    const maxRT = req.query.maxRT;
    const minMZ = req.query.minMZ;
    const maxMZ = req.query.maxMZ;
    const limit = req.query.limit;
    loadMzrtDataLib(projectDir, minRT, maxRT, minMZ, maxMZ, limit, function (err, rows) {
        res.write(JSON.stringify(rows));
        res.end();
   });
});

module.exports = loadMzrtData;