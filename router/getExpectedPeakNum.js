/*getExpectedPeakNum.js: return the expected number of peak, a parameter set in a init.ini file*/

const express = require("express");
const router = express.Router();
const getExpectedPeakNumLib = require("../library/getExpectedPeakNum");

/**
 * Express.js router for /getExpectedPeakNum
 * 
 * Return information of project, experiment or dataset with given type and ID
 */
const getExpectedPeakNum = router.get('/getExpectedPeakNum', function (req,res) {
    console.log("Hello, getExpectedPeakNum!");
    getExpectedPeakNumLib(function (err, peakNumber) {
        console.log("peakNumber router: ", peakNumber)

        if(!peakNumber) {
            res.write('4000');
        }else{
            res.write(peakNumber);
        }
        res.end();
    })
});

module.exports = getExpectedPeakNum;
