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
        if (!row) {
            res.write("invalid project ID!");
            res.end();
            return;
        }
        let filePath = row.projectDir;
        let idx = filePath.indexOf(".mzML");
        filePath = (filePath.slice(0, idx)).concat("_ms2_toppic_prsm_single.tsv");
        parsePtm(filePath, function(err, data){
            if (err) {
                res.write(err);
                res.end();
            } else {
                res.write(JSON.stringify(data));
                res.end();    
            }
        });
        
    });
});

module.exports = ptmQuery;