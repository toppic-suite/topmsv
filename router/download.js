/**
 * Express router for /download
 *
 * If envStatus is 0, then render mzML file to user.
 * If envStatus is 1, then zip all results files then render zip back to user.
 */
const express = require("express");
const router = express.Router();
const archiver = require("archiver");
const getProjectSummary = require("../library/getProjectSummary");
const fs = require("fs");

let download = router.get('/download', function (req,res) {
    let projectCode = req.query.id;
    getProjectSummary(projectCode, function (err,row) {
        let projectDir = row.projectDir;
        let projectName = row.projectName;
        let fileName = row.fileName;
        let envStatus = row.envelopeStatus;
        if (envStatus !== 1) {
            res.download(projectDir);
        } else {
            let fName = fileName.substr(0, fileName.lastIndexOf("."));
            let dbDir = projectDir.substr(0, projectDir.lastIndexOf("/"));

            let zipName = '/'+projectName+'.zip';
            let output = fs.createWriteStream(dbDir + zipName);

            let archive = archiver('zip', {
                zlib: { level: 9 } // Sets the compression level.
            });

            output.on('close', function() {
                console.log(archive.pointer() + ' total bytes');
                console.log('archiver has been finalized and the output file descriptor has closed.');
                res.download(dbDir + zipName);
            });

            archive.on('error', function(err) {
                throw err;
            });

            archive.pipe(output);

            let file1 = dbDir + '/' + fName + '_ms2.feature';
            let file2 = dbDir + '/' + fName + '_ms2.msalign';
            let file3 = dbDir + '/' + fName + '_ms1.feature';
            let file4 = dbDir + '/' + fName + '_feature.xml';
            let dir5 = dbDir + '/' + fName + '_file';
            archive
                .append(fs.createReadStream(file1), { name: fName + '_ms2.feature' })
                .append(fs.createReadStream(file2), { name: fName + '_ms2.msalign' })
                .append(fs.createReadStream(file3), { name: fName + '_ms1.feature' })
                .append(fs.createReadStream(file4), { name: fName + '_feature.xml' })
                .directory(dir5, fName + '_file')
                .finalize();
        }
    })
});
module.exports = download;