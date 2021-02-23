const express = require("express");
const router = express.Router();
const formidable = require("formidable");
const getProjectSummary = require("../library/getProjectSummary");
const submitTask = require("../library/submitTask");
const fs = require("fs");
const deleteSeq = require("../library/deleteSeqSync");
const updateSeqStatusSync = require("../library/updateSeqStatusSync");

/**
 * Express router for /toppicTask
 *
 * Hanld request to generate a toppic task, save files and delete previous sequence information in database
 */
const toppicTask = router.post('/toppicTask', function (req, res) {
    console.log("Hello, toppicTask");
    const app = './proteomics_cpp/bin/toppic';
    let commandArr = '';
    let form = new formidable.IncomingForm();
    form.maxFileSize = 5000 * 1024 * 1024; // 5gb file size limit
    form.encoding = 'utf-8';
    form.uploadDir = "tmp";
    form.keepExtensions = true;

    form.parse(req, function (err, fields, files) {
        let fastaFile = files.fastaFile;
        let lcmsFeatureFile = files.lcmsFeatureFile;
        let fixedPTMFile = files.fixedPTMFile;
        let ptmShiftFile = files.ptmShiftFile;
        let projectCode = fields.projectCode;
        let threadNum = fields.threadNum;
        let parameter = fields.command;
        let geneMzid = fields.geneMzid;
        let decoyData = fields.decoyData;
        console.log("parameter",parameter);
        console.log(projectCode);
        getProjectSummary(projectCode, function (err, row) {
            let envStatus = row.envelopeStatus;
            let projectDir = row.projectDir;
            let fileName = row.fileName;
            let msalign_name = fileName.substr(0, fileName.lastIndexOf(".")) + '_ms2.msalign';
            let msalign_dir = projectDir.substr(0, projectDir.lastIndexOf("/")) + '/' + msalign_name;
            let des_fastaFile = projectDir.substr(0, projectDir.lastIndexOf("/")) + '/' + fastaFile.name;
            let des_ptmShiftFile = 'None'; 
            let des_fixedPTMFile = 'None';
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
                    des_fixedPTMFile = projectDir.substr(0, projectDir.lastIndexOf("/")) + '/' + fixedPTMFile.name;
                    fs.renameSync(fixedPTMFile.path, des_fixedPTMFile);
                    parameter = parameter + ' -f '+ des_fixedPTMFile;
                }

                if (ptmShiftFile !== undefined) {
                    des_ptmShiftFile = projectDir.substr(0, projectDir.lastIndexOf("/")) + '/' + ptmShiftFile.name;
                    fs.renameSync(ptmShiftFile.path, des_ptmShiftFile);
                    parameter = parameter + ' -i '+ des_ptmShiftFile;
                }
                commandArr = parameter + ' -u '+ threadNum + ' ' + des_fastaFile + ' ' + msalign_dir;
                if (geneMzid){//if mzid file is generated, keep intermediate file
                    commandArr = parameter + ' -k -u '+ threadNum + ' ' + des_fastaFile + ' ' + msalign_dir;
                }
                console.log("commandArr",commandArr);
                console.log(threadNum);
                submitTask(projectCode,app, commandArr, threadNum);

                deleteSeq(projectDir, projectCode);
                updateSeqStatusSync(0, projectCode);
                let seqApp = 'node';
                let dbDir = projectDir.substr(0, projectDir.lastIndexOf(".")) + '.db';
                let seqName = fileName.substr(0, fileName.lastIndexOf(".")) + '_ms2_toppic_prsm.tsv';
                let seq_dir = projectDir.substr(0, projectDir.lastIndexOf("/")) + '/' + seqName;
                let seqParameter = './utilities/sequenceParse.js ' + dbDir + ' ' + seq_dir;
                console.log(seqParameter);
                updateSeqStatusSync(1, projectCode);
                submitTask(projectCode, seqApp, seqParameter, 1);

                //run mzid generator if mzid file is to be generated
                console.log(geneMzid, decoyData);
                if (geneMzid == 'true' || geneMzid == true){
                    let app = "python3";
                    let decoyName = des_fastaFile + "_target_decoy";
                    if (decoyData == 'false' || decoyData == false){
                        decoyName = des_fastaFile;
                    }
                    let param = './mzidGenerator/write_mzIdent.py ' + seq_dir + ' ' + decoyName + ' ' + des_fixedPTMFile + ' ' + des_ptmShiftFile;
                    console.log("Hello! mzid file generator")
                    console.log("param", param);
                    submitTask(projectCode, app, param, 1);
                }
                res.end();
            })
        })
    })

});

module.exports = toppicTask;