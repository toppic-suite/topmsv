var express = require("express");
var router = express.Router();
const getPeakListByScanID = require("../library/getPeakListByScanID");
const getPeakListByMZRange = require("../library/getPeakListByMZRange");
const getEnvPeakListSync = require("../library/getEnvPeakListSync");
const getEnvInfoSync = require("../library/getEnvInfoSync");
const getEnvIDListByMZRange = require("../library/getEnvIDListByMZRange");
const molecularFormulae = require('../distribution_calc/molecularformulae');
const calcDistribution = new molecularFormulae();

var previewEdit = router.get("/previewEdit", function (req, res) {
    console.log("Hello, previewEdit!");
    let projectDir = req.query.projectDir;
    let scan_id = req.query.scan_id;
    let envID = req.query.envelope_id;
    let charge = req.query.charge;
    let monoMass = req.query.mono_mass;
    // let theoInteSum = req.query.intensity;

    getPeakListByScanID(projectDir, scan_id, function (rows) {
        let peakList = calcDistribution.emass(monoMass,charge,rows);
        // console.log(peakList);
        if (!peakList) {
            console.log('No peaks match!');
            // res.send(500, {errors: 'No peak match found!'});
            res.status(500).send({errors: 'No peak match found!'});
        } else {
            let peaksum = 0;
            peakList.forEach(peak => {
                peaksum = peaksum + peak.intensity;
            });
            let theoInteSum = peaksum.toFixed(5);
            // find the range of envlist
            let minMZ = Math.floor(peakList[0].mz) - 20;
            let maxMZ = Math.ceil(peakList[peakList.length -1].mz) + 20;
            let returnEnvList = [{}];
            returnEnvList[0].env_peaks = peakList;
            returnEnvList[0].mono_mass = monoMass;
            returnEnvList[0].charge = charge;
            returnEnvList[0].env = {};
            returnEnvList[0].env.envelope_id = envID;
            returnEnvList[0].env.scan_id = scan_id;
            returnEnvList[0].env.mono_mass = monoMass;
            returnEnvList[0].env.intensity = theoInteSum;
            returnEnvList[0].env.charge = charge;
            let envIDList = getEnvIDListByMZRange(projectDir, minMZ, maxMZ, scan_id);

            let resultList = getPeakListByMZRange(projectDir, minMZ, maxMZ, scan_id);
            let originalEnvPeaks = getEnvPeakListSync(projectDir, envID);
            let returnOriEnvList = [{}];
            returnOriEnvList[0].env_peaks = originalEnvPeaks;
            let oriEnvInfo = getEnvInfoSync(projectDir, envID);
            returnOriEnvList[0].mono_mass = oriEnvInfo.mono_mass;
            returnOriEnvList[0].charge = oriEnvInfo.charge;
            if(envIDList) {
                envIDList.forEach(env => {
                    let tempObj = {};
                    let tempEnvList = getEnvPeakListSync(projectDir, env.envelope_id);
                    let tempInfo = getEnvInfoSync(projectDir, env.envelope_id)
                    tempObj.env_peaks = tempEnvList;
                    tempObj.charge= tempInfo.charge;
                    tempObj.mono_mass = tempInfo.mono_mass;
                    if (env.envelope_id !== parseInt(envID,10)) {
                        returnEnvList.push(tempObj);
                    }
                    returnOriEnvList.push(tempObj);
                });
            }
            let originalPeakList = getPeakListByMZRange(projectDir, Math.floor(originalEnvPeaks[0].mz)-20, Math.ceil(peakList[peakList.length -1].mz) + 20, scan_id);
            let returnJSON = JSON.stringify({peaklist: resultList, envlist: returnEnvList, originalPeakList:originalPeakList, originalEnvPeaks: returnOriEnvList});
            // console.log(returnJSON);
            res.json(returnJSON);
            res.end();
        }
    });
})

module.exports = previewEdit;