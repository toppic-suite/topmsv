const express = require("express");
const router = express.Router();
const getPeakListByScanID = require("../library/getPeakListByScanID");
const editEnv = require("../library/editEnv");
const addEnvPeak = require("../library/addEnvPeak");
const getEnv = require("../library/getEnv");
const molecularFormulae = require('../distribution_calc/molecular_formulae');
const calcDistribution = new molecularFormulae();

/**
 * Expree.js router for /editrow
 * 
 * Edit envelope information and then calculate envelope peaks again based on the new 
 * evenlope information. In the end, save new envelope peaks into database.
 */
let editrow = router.get("/editrow", function (req, res) {
    console.log("Hello, editrow!");
    let projectDir = req.query.projectDir;
    let scan_id = req.query.scan_id;
    let envID = req.query.envelope_id;
    let charge = req.query.charge;
    let monoMass = req.query.mono_mass;
    let theoInteSum = req.query.intensity;

    getPeakListByScanID(projectDir, scan_id, function (rows) {
        let peakList = calcDistribution.emass(monoMass,charge,rows);
        // console.log(peakList);
        if (!peakList) {
            // console.log('No match!');
            // res.send(500, {errors: 'No peak match found!'});
            res.status(500).send({errors: 'No peak match found!'});
        } else {
            let peaksum = 0;
            peakList.forEach(peak => {
                peaksum = peaksum + peak.intensity;
            });
            theoInteSum = peaksum.toFixed(5);
            // console.log(theoInteSum);
            editEnv(projectDir,envID,charge,monoMass,theoInteSum,function () {
                addEnvPeak(projectDir,charge,monoMass,scan_id,envID,function () {
                    getEnv(projectDir,envID,function (row) {
                        res.json(row);
                        res.end();
                    });
                });
            })
        }
    });
})

module.exports = editrow;