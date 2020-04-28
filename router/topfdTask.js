/**
 * Express router for /topfdTask
 *
 * Handle request to create a topFD task, generate parameter for task and delete previous envelope peaks
 */
var express = require("express");
var router = express.Router();
var BetterDB = require("better-sqlite3");
var deleteEnvPeak = require("../library/deleteEnvPeak");
var submitTask = require("../library/submitTask");
var updateEnvStatusSync = require("../library/updateEnvStatusSync");

var topfdTask = router.get('/topfdTask', function (req,res) {
    const app = './proteomics_cpp/bin/topfd';
    let commandArr = '';
    let projectCode = req.query.projectCode;

    // console.log(req.query);
    let maximumCharge = req.query.Maximum_charge;
    if (maximumCharge !== '') {
        commandArr += '-c ';
        commandArr += maximumCharge;
    }

    let maximumMass = req.query.Maximum_mass;
    if (maximumMass !== '') {
        commandArr += ' -m ';
        commandArr += maximumMass;
    }
    let ms1SignalNoiseRatio = req.query.MS1_signal_noise_ratio;
    if (ms1SignalNoiseRatio !== '') {
        commandArr += ' -r ';
        commandArr += ms1SignalNoiseRatio;
    }

    let msMsSignalNoiseRatio = req.query.MS_MS_signal_noise_ratio;
    if (msMsSignalNoiseRatio !== '') {
        commandArr += ' -t ';
        commandArr += msMsSignalNoiseRatio;
    }

    let mzError = req.query.M_Z_error;
    if (mzError !== '') {
        commandArr += ' -e ';
        commandArr += mzError;
    }

    let precursorWindow = req.query.Precursor_window;
    if (precursorWindow !== '') {
        commandArr += ' -w ';
        commandArr += precursorWindow;
    }

    let msSpectra = req.query.MS_Spectra;
    if (msSpectra === 'on') {
        commandArr += ' -o';
    }

    let threadNumber = req.query.thread_number;
    if (threadNumber !== '') {
        commandArr += ' -u ';
        commandArr += threadNumber;
    }

    let resultDb = new BetterDB('./db/projectDB.db');
    let stmt = resultDb.prepare(`SELECT ProjectDir AS projectDir, FileName AS fileName
                                FROM Projects
                                WHERE projectCode = ?;`);
    let result = stmt.get(projectCode);
    resultDb.close();
    // console.log(result);
    let projectDir;
    if (result) {
        projectDir = result.projectDir;
        commandArr += ' ';
        commandArr += projectDir;
        // console.log(projectDir);
        // console.log(commandArr);
        deleteEnvPeak(projectDir, projectCode);
        submitTask(projectCode, app, commandArr, threadNumber);
        let fileName = result.fileName.substr(0, result.fileName.lastIndexOf("."));
        let dbDir = projectDir.substr(0, projectDir.lastIndexOf(".")) + '.db';
        let des_ms1 = projectDir.substr(0, projectDir.lastIndexOf("/")) + '/'+ fileName + '_file/' + fileName + '_ms1.msalign';
        let des_ms2 = projectDir.substr(0, projectDir.lastIndexOf("/")) + '/'+ fileName + '_ms2.msalign';

        updateEnvStatusSync(1, projectCode);
        submitTask(projectCode, 'node','./convertMS1Msalign.js ' + dbDir + ' ' + des_ms1, 1);
        submitTask(projectCode, 'node','./convertMS2Msalign.js ' + dbDir + ' ' + des_ms2, 1);
    } else {
        res.write("No such project exists!");
        res.end();
        return;
    }
    res.sendFile(__dirname + '/public/backToHome.html');
    // res.redirect('/');
    // res.write('Your task is submitted, please wait for result! Please go back to home page to wait result: <a href ="https://toppic.soic.iupui.edu/">Home</a>');
    // res.end();
});

module.exports = topfdTask;