"use strict";
const express = require("express");
const router = express.Router();
const getPeaksPerTableLib = require("../library/getPeaksPerTable");
/**
 * Express.js router for /getPeaksPerTable
 */
//don't seem to be used 
const getPeaksPerTable = router.get('/getPeaksPerTable', function (req, res) {
    /*console.log("Hello, getPeaksPerTable!");
    const projectDir = req.query.projectDir;
    const layerCount = req.query.layerCount;
    getPeaksPerTableLib(projectDir, layerCount, function (err, row) {
        //console.log(typeof(row));
        if (err) {
            res.write("0");
            res.end();
        } else {
            res.write(JSON.stringify(row));
            res.end();
        }
    })*/
});
module.exports = getPeaksPerTable;
