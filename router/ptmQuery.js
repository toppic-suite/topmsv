const express = require("express");
const router = express.Router();
const getProjectSummary = require("../library/getProjectSummary");
const parsePtm = require("../library/parsePtm");

/**
 * Express router for /ptmQuery
 *
 * Get ptm information from a tsv file
 * send back the information to user
 */
const ptmQuery = router.get('/ptmQuery', function (req, res) {
    let projectCode = req.query.projectCode;
    getProjectSummary(projectCode, function (err,row) {
        let filePath = row.projectDir;
        let idx = filePath.indexOf(".mzML");
        filePath = (filePath.slice(0, idx)).concat("_ms2_toppic_prsm.tsv");
        parsePtm(filePath, function(err, data){
            res.write(JSON.stringify(data));
            res.end();
        });
        
    });
});

module.exports = ptmQuery;