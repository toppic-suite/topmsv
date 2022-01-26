const express = require("express");
const router = express.Router();
const getNext = require("../library/getNext");

/**
 * Express.js router for /next
 * Return next scan number with given scan number
 */
const next = router.get('/next', function(req, res) {
    console.log("Hello, next!");
    const projectDir = req.query.projectDir;
    const scanID = req.query.scanID;
    getNext(projectDir, scanID, function (err, row) {
        if (!row) {
            res.write("0");
            res.end();
            return;
        }
        let nextID = row.next.toString();
        res.write(nextID);
        res.end();
    })
});
module.exports = next;