/**
 * Express router for /toppicTask
 *
 * Hanld request to generate a toppic task, save files and delete previous sequence information in database
 */
var express = require("express");
var router = express.Router();
var formidable = require("formidable");
var getProjectSummary = require("../library/getProjectSummary");
var submitTask = require("../library/submitTask");
var fs = require("fs");
var deleteSeq = require("../library/deleteSeqSync");
var updateSeqStatusSync = require("../library/updateSeqStatusSync");

var toppicTask = router.post('/toppicTask', function (req, res) {
    console.log("Hello, toppicTask");
    const app = './proteomics_cpp/bin/toppic';
    let commandArr = '';
    var form = new formidable.IncomingForm();
    form.maxFileSize = 5000 * 1024 * 1024; // 5gb file size limit
    form.encoding = 'utf-8';
    form.uploadDir = "tmp";
    form.keepExtensions = true;

    form.parse(req, function (err, fields, files) {
        var fastaFile = files.fastaFile;
        var lcmsFeatureFile = files.lcmsFeatureFile;
        var fixedPTMFile = files.fixedPTMFile;
        var ptmShiftFile = files.ptmShiftFile;
        var projectCode = fields.projectCode;
        var threadNum = fields.threadNum;
        var parameter = fields.command;
        console.log("parameter",parameter);
        console.log(projectCode);
        getProjectSummary(projectCode, function (err, row) {
            let envStatus = row.envelopeStatus;
            let projectDir = row.projectDir;
            let fileName = row.fileName;
            let msalign_name = fileName.substr(0, fileName.lastIndexOf(".")) + '_ms2.msalign';
            let msalign_dir = projectDir.substr(0, projectDir.lastIndexOf("/")) + '/' + msalign_name;
            var des_fastaFile = projectDir.substr(0, projectDir.lastIndexOf("/")) + '/' + fastaFile.name;
            fs.rename(fastaFile.path, des_fastaFile, function (err) {
                if (err) {
                    console.log(err);
                    return res.send({"error": 403, "message": "Error on saving file!"});
                }
                console.log("Files are saved.");
                console.log("msaling_dir", msalign_dir);
                if (!fs.existsSync(msalign_dir)) {
                    console.log('The msalign file does not exist.');
                    return res.send({"error": 403, "message": "Error on finding msalign file! Please run TopFD first!"});
                }

                if(fixedPTMFile !== undefined) {
                    var des_fixedPTMFile = projectDir.substr(0, projectDir.lastIndexOf("/")) + '/' + fixedPTMFile.name;
                    fs.renameSync(fixedPTMFile.path, des_fixedPTMFile);
                    parameter = parameter + ' -f '+ des_fixedPTMFile;
                }

                if (ptmShiftFile !== undefined) {
                    var des_ptmShiftFile = projectDir.substr(0, projectDir.lastIndexOf("/")) + '/' + ptmShiftFile.name;
                    fs.renameSync(ptmShiftFile.path, des_ptmShiftFile);
                    parameter = parameter + ' -i '+ des_ptmShiftFile;
                }

                commandArr = parameter + ' -u '+ threadNum + ' ' + des_fastaFile + ' ' + msalign_dir;
                console.log("commandArr",commandArr);
                console.log(threadNum);
                submitTask(projectCode,app, commandArr, threadNum);

                deleteSeq(projectDir, projectCode);
                updateSeqStatusSync(0, projectCode);
                let seqApp = 'node';
                let dbDir = projectDir.substr(0, projectDir.lastIndexOf(".")) + '.db';
                let seqName = fileName.substr(0, fileName.lastIndexOf(".")) + '_ms2_toppic_prsm.tsv';
                let seq_dir = projectDir.substr(0, projectDir.lastIndexOf("/")) + '/' + seqName;
                let seqParameter = './sequenceParse.js ' + dbDir + ' ' + seq_dir;
                console.log(seqParameter);
                updateSeqStatusSync(1, projectCode);
                submitTask(projectCode, seqApp, seqParameter, 1);
                res.end();
            })
        })
    })

});

module.exports = toppicTask;