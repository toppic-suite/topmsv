/**
 * Express router for /addrow
 *
 * Add one envelope and calculate its distribution then save it in existing database
 */
var express = require("express");
var router = express.Router();
var getPeakListByScanID = require("../library/getPeakListByScanID");
var getEnvMax = require("../library/getEnvMax");
var addEnv = require("../library/addEnv");
var addEnvPeak = require("../library/addEnvPeak");
var getEnv = require("../library/getEnv");
const molecularFormulae = require('../distribution_calc/molecularformulae');
const calcDistribution = new molecularFormulae();

var addrow = router.get('/addrow', function (req,res) {
    console.log("Hello, addrow!");
    let projectDir = req.query.projectDir;
    //let envID = req.query.envelope_id;
    let scan_id = req.query.scan_id;
    let charge = req.query.charge;
    let monoMass = req.query.mono_mass;
    let theoInteSum = req.query.intensity;
    getPeakListByScanID(projectDir, scan_id, function (rows) {
        let peakList = calcDistribution.emass(monoMass,charge,rows);
        // console.log(peakList);
        if (!peakList) {
            console.log('No match!');
            // res.send(500, {errors: 'No peak match found!'});
            res.status(500).send({errors: 'No peak match found!'});
        } else {
            let peaksum = 0;
            peakList.forEach(peak => {
                peaksum = peaksum + peak.intensity;
            });
            theoInteSum = peaksum.toFixed(5);
            // console.log(theoInteSum);
            getEnvMax(projectDir,function (envID) {
                //console.log(envID);
                ++envID;
                addEnv(projectDir,envID,scan_id,charge,monoMass,theoInteSum,function () {
                    addEnvPeak(projectDir,charge,monoMass,scan_id,envID,function (err) {
                        if (err) {
                            console.log(err);
                            // res.status(500).send({errors: 'No peak match found!'});
                        }
                        getEnv(projectDir,envID,function (row) {
                            res.json(row);
                            res.end();
                        });
                    });
                });
            })
        }
    });
});

module.exports = addrow;