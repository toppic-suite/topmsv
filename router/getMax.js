"use strict";
const express = require("express");
const router = express.Router();
const getMaxLib = require("../library/getMax");
/**
 * Express.js router for /getMax
 *
 * minimum maximum value of rt and m/z for this mzML file
 */
let getMax = router.get('/getMax', function (req, res) {
    console.log("Hello, getMax!");
    const projectDir = req.query.projectDir;
    getMaxLib(projectDir, function (err, row) {
        res.write(JSON.stringify(row));
        res.end();
    });
});
module.exports = getMax;
