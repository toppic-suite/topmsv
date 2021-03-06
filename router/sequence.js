const express = require("express");
const router = express.Router();
const deleteSeq = require("../library/deleteSeqSync")
const updateSeqStatusSync = require("../library/updateSeqStatusSync");
const submitTask = require("../library/submitTask");
const sendFailureMess = require("../library/sendFailureMess");
const formidable = require('formidable');
const fs = require('fs');

/**
 * Express router for /sequence
 *
 * Handle request to upload sequence file, delete current sequence information in database
 * then submit task to process sequence file
 */
let sequence = router.post('/sequence', function (req,res) {
    console.log('Hello, sequence!');
    let form = new formidable.IncomingForm();
    form.maxFileSize = 5000 * 1024 * 1024; // 5gb file size limit
    form.encoding = 'utf-8';
    form.uploadDir = "tmp";
    form.keepExtensions = true;
    form.parse(req, function (err, fields, files) {
        let seqFile = files.seqFile;
        let email = fields.email;
        let projectDir = fields.projectDir;
        let projectName = fields.projectName;
        let projectCode = fields.projectCode;
        let dbDir = projectDir.substr(0, projectDir.lastIndexOf(".")) + '.db';
        let des_seq = projectDir.substr(0, projectDir.lastIndexOf("/")) + '/' + seqFile.name;
        if (seqFile === undefined) {
            console.log("Upload files failed!");
            sendFailureMess(projectName, projectCode, email);
            return;
        }
        fs.rename(seqFile.path, des_seq, function (err) {
            if (err) {
                console.log(err);
                return res.send({"error": 403, "message": "Error on saving file!"});
            }
            deleteSeq(projectDir, projectCode);
            updateSeqStatusSync(0,projectCode);
            res.end();
            let parameter = __dirname + '/../utilities/sequenceParse.js ' + dbDir + ' ' + des_seq + ' ' + projectCode;
            submitTask(projectCode, 'node', parameter, 1);
            updateSeqStatusSync(1, projectCode);
        })
    })
});

module.exports = sequence;