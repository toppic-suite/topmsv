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
        let seqStatus = row.sequenceStatus; 
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

            let topfdFiles = ['_ms2.feature', '_ms1.msalign','_ms2.msalign', '_ms1.feature', '_feature.xml'];
            let toppicFiles = ['_ms2_toppic_proteoform.tsv', '_ms2_toppic_proteoform.xml', '_ms2_toppic_prsm.tsv'];

            topfdFiles.forEach(fileName => {
                let path = dbDir + '/' + fName + fileName;
                if (fs.existsSync(path)) {
                    archive.append(fs.createReadStream(path), { name: fName + fileName });
                }
            })

            let dirName = dbDir + '/' + fName + '_file';
            //topfd _file folder
            if (fs.existsSync(dirName)) {
                archive.directory(dirName, fName + '_file')
            }

            if (seqStatus == 1) {
                toppicFiles.forEach(fileName => {
                    let path = dbDir + '/' + fName + fileName;
                    if (fs.existsSync(path)) {
                        archive.append(fs.createReadStream(path), { name: fName + fileName });
                    }
                })
            }

            archive.finalize();

            /*//topfd files
            let file1 = dbDir + '/' + fName + '_ms2.feature';
            let file2 = dbDir + '/' + fName + '_ms2.msalign';
            let file3 = dbDir + '/' + fName + '_ms1.feature';
            let file4 = dbDir + '/' + fName + '_feature.xml';
            let dir5 = dbDir + '/' + fName + '_file';

            //toppic files
            let file5 = dbDir + '/' + fName + '_ms2_toppic_proteoform.tsv';
            let file6 = dbDir + '/' + fName + '_ms2_toppic_proteoform.xml';
            let file7 = dbDir + '/' + fName + '_ms2_toppic_prsm.tsv';

            //add error handling for when some files are missing 
            //because they were manually uploaded

            archive
                .append(fs.createReadStream(file1), { name: fName + '_ms2.feature' })
                .append(fs.createReadStream(file2), { name: fName + '_ms2.msalign' })
                .append(fs.createReadStream(file3), { name: fName + '_ms1.feature' })
                .append(fs.createReadStream(file4), { name: fName + '_feature.xml' })
                .directory(dir5, fName + '_file')
                .finalize();*/
        }
    })
});
module.exports = download;