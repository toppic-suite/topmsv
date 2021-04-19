const express = require("express");
const router = express.Router();
const checkAllowToppicStatus = require("../library/checkAllowToppicStatus");

/**
 * Express.js router for /checkAllowToppicStatus
 * 
 * return allowtoppic status
 */
const getAllowToppicStatus = router.get('/getAllowToppicStatus', function (req,res) {
    console.log("Hello, getAllowToppicStatus!");
    const projectCode = req.query.projectCode;

    checkAllowToppicStatus(projectCode, function (err, row) {
        res.write(JSON.stringify(row));
        res.end();
    })
});

module.exports = getAllowToppicStatus;
