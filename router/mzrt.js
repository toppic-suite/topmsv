/**
 * Express router for /msalign
 *
 * Handle request to upload msalign file, save files to project directory,
 * then delete current envelope peaks and submit process msalign file task to
 * task scheduler
 */
var express = require("express");
var router = express.Router();
const deleteFeature = require("../library/deleteFeature");
const sendFailureMess = require("../library/sendFailureMess");
const submitTask = require("../library/submitTask");
const updateFeatureStatusSync = require("../library/updateFeatureStatusSync");
const formidable = require('formidable');
const fs = require("fs");

var mzrt = router.post('/mzrt', function (req, res) {
	console.log("Hello, mzrt!")
    var form = new formidable.IncomingForm();
    form.maxFileSize = 5000 * 1024 * 1024; // 5gb file size limit
    form.encoding = 'utf-8';
    form.uploadDir = "tmp";
    form.keepExtensions = true;
    form.parse(req, function (err, fields, files) {
        var mzrtFile = files.mzrtFile;
        var dbDir = fields.projectDir;
        var projectName = fields.projectName;
        var projectCode = fields.projectCode;
        deleteFeature(dbDir, projectCode);
        console.log('Deleted previous Feature!');
        var email = fields.email;
        dbDir = dbDir.substr(0, dbDir.lastIndexOf(".")) + '.db';
        var des_ms1 = dbDir.substr(0, dbDir.lastIndexOf("/")) + '/' + mzrtFile.name;
        if (mzrtFile === undefined) {
            console.log("Upload files failed!");
            sendFailureMess(projectName, projectCode, email);
            return;
        }
        fs.rename(mzrtFile.path, des_ms1, function (err) {
            if (err) {
                console.log(err);
                return res.send({"error": 403, "message": "Error on saving file!"});
            }
            res.end();
            let parameterTask1 = __dirname + '/../utilities/annotateFeature.js '+ dbDir + ' ' + des_ms1;
            submitTask(projectCode, 'node', parameterTask1, 1);

            updateFeatureStatusSync(1, projectCode);
        })
    })
});
module.exports = mzrt;