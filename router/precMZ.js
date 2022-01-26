const express = require("express");
const router = express.Router();
const getPrecMZ = require("../library/getPrecMZ");

/**
 * Express.js router for /precMZ
 * Return precursor M/Z value with given scan number
 */
const precMZ = router.get('/precMZ', function (req, res) {
    console.log("Hello, precMZ!");
    const projectDir = req.query.projectDir;
    const scanID = req.query.scanID;
    getPrecMZ(projectDir, scanID, function (err, row) {
        if (row !== undefined){
            let precMZ = row.precMZ.toString();
            res.write(precMZ);
            res.end();
        }else {
            res.write("0");
            res.end();
        }
    })
});

module.exports = precMZ;