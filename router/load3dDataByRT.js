const express = require("express");
const router = express.Router();
const load3dDataByRTLib = require("../library/load3dDataByRT");

/**
 * Express.js router for /load3dDataByRT
 */
const load3dDataByRT = router.get('/load3dDataByRT', function (req, res) {
    console.log("Hello, load3dDataByRT!");
    const projectDir = req.query.projectDir;
    const rt = req.query.RT;
    const tableNum = req.query.tableNum
    const minMZ = req.query.minMZ;
    const maxMZ = req.query.maxMZ;
    load3dDataByRTLib(projectDir, rt, tableNum, minMZ, maxMZ, function (err, rows) {
        res.write(JSON.stringify(rows));
        res.end();
   });
});

module.exports = load3dDataByRT;