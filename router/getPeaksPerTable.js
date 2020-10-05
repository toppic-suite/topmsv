const express = require("express");
const router = express.Router();
const getPeaksPerTableLib = require("../library/getPeaksPerTable");

/**
 * Express.js router for /getPeaksPerTable
 * 
 * get minimum maximum value of rt and m/z for this mzML file
 */
const getPeaksPerTable = router.get('/getPeaksPerTable', function (req, res) {
    console.log("Hello, getPeaksPerTable!");
    const projectDir = req.query.projectDir;
    const layerCount = req.query.layerCount;
    getPeaksPerTableLib(projectDir, layerCount, function (err, row) {
        //console.log(typeof(row));
        res.write(JSON.stringify(row));
        res.end();
    })
});

module.exports = getPeaksPerTable;