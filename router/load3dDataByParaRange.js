"use strict";
const express = require("express");
const router = express.Router();
const load3dDataByParaRangeLib = require("../library/load3dDataByParaRange");
/**
 * Express.js router for /load3dDataByParaRange
 */
const load3dDataByParaRange = router.get('/load3dDataByParaRange', function (req, res) {
    console.log("Hello, load3dDataByParaRange!");
    const projectDir = req.query.projectDir;
    const tableNum = req.query.tableNum;
    const minRT = req.query.minRT;
    const maxRT = req.query.maxRT;
    const minMZ = req.query.minMZ;
    const maxMZ = req.query.maxMZ;
    const maxPeaks = req.query.maxPeaks;
    const cutoff = req.query.cutoff;
    load3dDataByParaRangeLib(projectDir, tableNum, minRT, maxRT, minMZ, maxMZ, maxPeaks, cutoff, function (err, rows) {
        res.write(JSON.stringify(rows));
        res.end();
    });
});
module.exports = load3dDataByParaRange;
