/**
 * Express router for /download
 *
 * If envStatus is 0, then render mzML file to user.
 * IF envStatus is 1, then zip all results files then render zip back to user.
 */
var express = require("express");
var router = express.Router();
var archiver = require("archiver");
var getProjectSummary = require("../library/getProjectSummary");
var fs = require("fs");

var download = router.get('/download', function (req,res) {
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
            var output = fs.createWriteStream(dbDir + zipName);

            var archive = archiver('zip', {
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

            var file1 = dbDir + '/' + fName + '_ms2.feature';
            var file2 = dbDir + '/' + fName + '_ms2.msalign';
            var file3 = dbDir + '/' + fName + '_ms1.feature';
            var file4 = dbDir + '/' + fName + '_feature.xml';
            var dir5 = dbDir + '/' + fName + '_file';
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