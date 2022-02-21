"use strict";
const express = require("express");
const fs = require("fs");
const router = express.Router();
/**
 * Express.js router for /loadDataRange
 */
const loadDataRange = router.get('/loadDataRange', function (req, res) {
    console.log("Hello, loadDataRange!");
    let projectDir = req.query.projectDir;
    let rangeData;
    fs.readFile(projectDir, "utf8", (err, data) => {
        if (err) {
            console.error(err);
            return;
        }
        data = data.split("\t");
        let dataObj = { "mzmin": 0, "mzmax": 0, "mzrange": 0, "rtmin": 0, "rtmax": 0, "rtrange": 0, "intmin": 0, "intmax": 0, "intrange": 0 };
        dataObj.mzmin = parseFloat(data[0]);
        dataObj.mzmax = parseFloat(data[1]);
        dataObj.rtmin = parseFloat(data[2]);
        dataObj.rtmax = parseFloat(data[3]);
        dataObj.intmin = parseFloat(data[4]);
        dataObj.intmax = parseFloat(data[5].replace(/\n/g, ''));
        dataObj.mzrange = dataObj.mzmax - dataObj.mzmin;
        dataObj.rtrange = dataObj.rtmax - dataObj.rtmin;
        dataObj.intrange = dataObj.intmax - dataObj.intmin;
        rangeData = JSON.stringify(dataObj);
        res.write(rangeData);
        res.end();
    });
});
module.exports = loadDataRange;
