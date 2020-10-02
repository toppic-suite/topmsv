/**
 * Express router for /sequence
 *
 * Handle request to upload sequence file, delete current sequence information in database
 * then submit task to process sequence file
 */
var express = require("express");
var router = express.Router();
var deleteSeq = require("../library/deleteSeqSync")
var updateSeqStatusSync = require("../library/updateSeqStatusSync");
var submitTask = require("../library/submitTask");
var sendFailureMess = require("../library/sendFailureMess");
const formidable = require('formidable');
const fs = require('fs');

var sequence = router.post('/sequence', function (req,res) {
    console.log('Hello, sequence!');
    var form = new formidable.IncomingForm();
    form.maxFileSize = 5000 * 1024 * 1024; // 5gb file size limit
    form.encoding = 'utf-8';
    form.uploadDir = "tmp";
    form.keepExtensions = true;
    form.parse(req, function (err, fields, files) {
        var seqFile = files.seqFile;
        var email = fields.email;
        var projectDir = fields.projectDir;
        var projectName = fields.projectName;
        var projectCode = fields.projectCode;
        var dbDir = projectDir.substr(0, projectDir.lastIndexOf(".")) + '.db';
        var des_seq = projectDir.substr(0, projectDir.lastIndexOf("/")) + '/' + seqFile.name;
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
            let parameter = __dirname + '/utilities/sequenceParse.js ' + dbDir + ' ' + des_seq;
            submitTask(projectCode, 'node', parameter, 1);
            updateSeqStatusSync(1, projectCode);
            /*execFile('node',[__dirname + '/sequenceParse.js',dbDir,des_seq],((err, stdout, stderr) => {
                if(err) {
                    console.log('Processing sequence file failed!');
                    sendFailureMess(db, projectName, projectCode, email);
                    return;
                }
                updateSeqStatus(db,1, projectCode, function () {
                    updateProjectStatus(db, 1, projectCode, function () {
                        console.log('Sequence process is done!');
                    });
                });
            }))*/
        })
    })
});

module.exports = sequence;