const express = require("express");
const router = express.Router();
const getScanLevelTwoList = require("../library/getScanLevelTwoList");

/**
 * Express.js router for /scanTwoList
 * 
 * Return array of scan level two information by given scan level one ID
 */
const scanTwoList = router.get('/scanTwoList', function (req, res) {
    console.log("Hello, scanTwoList!");
    const projectDir = req.query.projectDir;
    const scanID = req.query.scanID;
    getScanLevelTwoList(projectDir, scanID, function (err, rows) {
        res.write(JSON.stringify(rows));
        // console.log(rows);
        res.end();
    })
});
module.exports = scanTwoList;