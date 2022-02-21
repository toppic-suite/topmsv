"use strict";
const express = require("express");
const router = express.Router();
const deleteFeature = require("../library/deleteFeature");
const deleteFeatureFile = require("../library/deleteFeatureFile");
const sendFailureMess = require("../library/sendFailureMess");
const submitTask = require("../library/submitTask");
const updateFeatureStatusSync = require("../library/updateFeatureStatusSync");
const formidable = require('formidable');
const fs = require("fs");
const path = require("path");
/**
 * Express.js router for /mzrt
 */
const mzrt = router.post('/mzrt', function (req, res) {
    console.log("Hello, mzrt!");
    let form = new formidable.IncomingForm();
    form.maxFileSize = 5000 * 1024 * 1024; // 5gb file size limit
    form.encoding = 'utf-8';
    form.uploadDir = "tmp";
    form.keepExtensions = true;
    form.parse(req, function (err, fields, files) {
        let mzrtFile = files.mzrtFile;
        let dbDir = fields.projectDir;
        let projectName = fields.projectName;
        let projectCode = fields.projectCode;
        deleteFeature(dbDir, projectCode);
        deleteFeatureFile(dbDir);
        let email = fields.email;
        dbDir = dbDir.substr(0, dbDir.lastIndexOf(".")) + '.db';
        let des_ms1 = dbDir.substr(0, dbDir.lastIndexOf(path.sep)) + path.sep + mzrtFile.name;
        if (mzrtFile === undefined) {
            console.log("Upload files failed!");
            sendFailureMess(projectName, projectCode, email);
            return;
        }
        fs.rename(mzrtFile.path, des_ms1, function (err) {
            if (err) {
                console.log(err);
                return res.send({ "error": 403, "message": "Error on saving file!" });
            }
            res.end();
            let parameterTask1 = path.join(__dirname, '..', 'utilities', 'annotateFeature.js') + ' ' + dbDir + ' ' + des_ms1;
            submitTask(projectCode, 'node', parameterTask1, 1);
            updateFeatureStatusSync(1, projectCode);
        });
    });
});
module.exports = mzrt;
