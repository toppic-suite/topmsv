"use strict";
const express = require("express");
const router = express.Router();
const getStatusLogLib = require("../library/getStatusLog");
/**
 * Express.js router for /getStatusLog
 * Return contents of a log file for each task
 */
const getStatusLog = router.get('/getStatusLog', function (req, res) {
    console.log("Hello, getStatusLog!");
    const fileName = req.query.fileName;
    getStatusLogLib(fileName, function (err, log) {
        if (err) {
            res.write("ERROR: Failed to retrieve log");
        }
        else {
            res.write(log);
            res.end();
        }
    });
});
module.exports = getStatusLog;
