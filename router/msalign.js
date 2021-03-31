const express = require("express");
const router = express.Router();
const deleteEnvPeak = require("../library/deleteEnvPeak");
const sendFailureMess = require("../library/sendFailureMess");
const submitTask = require("../library/submitTask");
const updateEnvStatusSync = require("../library/updateEnvStatusSync");
const formidable = require('formidable');
const fs = require("fs");

/**
 * Express router for /msalign
 *
 * Handle request to upload msalign file, save files to project directory,
 * then delete current envelope peaks and submit process msalign file task to
 * task scheduler
 */
let msalign = router.post('/msalign', function (req, res) {
    let form = new formidable.IncomingForm();
    form.maxFileSize = 5000 * 1024 * 1024; // 5gb file size limit
    form.encoding = 'utf-8';
    form.uploadDir = "tmp";
    form.keepExtensions = true;
    form.parse(req, function (err, fields, files) {
        let ms1 = files.ms1file;
        let ms2 = files.ms2file;
        let dbDir = fields.projectDir;
        let projectName = fields.projectName;
        let projectCode = fields.projectCode;
        deleteEnvPeak(dbDir, projectCode);

        console.log('Deleted previous Envelope Peaks!');
        let email = fields.email;
        dbDir = dbDir.substr(0, dbDir.lastIndexOf(".")) + '.db';
        let des_ms1 = dbDir.substr(0, dbDir.lastIndexOf("/")) + '/' + ms1.name;
        let des_ms2 = dbDir.substr(0, dbDir.lastIndexOf("/")) + '/' + ms2.name;
        if (ms1 === undefined || ms2 === undefined) {
            console.log("Upload files failed!");
            sendFailureMess(projectName, projectCode, email);
            return;
        }
        fs.rename(ms1.path, des_ms1, function (err) {
            if (err) {
                console.log(err);
                return res.send({"error": 403, "message": "Error on saving file!"});
            }
            fs.rename(ms2.path, des_ms2, function (err) {
                if (err) {
                    console.log(err);
                    return res.send({"error": 403, "message": "Error on saving file!"});
                }
                res.end();
                let parameterTask1 = __dirname + '/../utilities/convertMS1Msalign.js '+ dbDir + ' ' + des_ms1;
                submitTask(projectCode, 'node', parameterTask1, 1);

                let parameterTask2 = __dirname + '/../utilities/convertMS2Msalign.js '+ dbDir + ' ' + des_ms2;
                submitTask(projectCode, 'node', parameterTask2, 1);
                updateEnvStatusSync(1, projectCode);
            })
        })
    })
});

module.exports = msalign;