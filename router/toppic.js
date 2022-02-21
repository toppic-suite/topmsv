"use strict";
const express = require("express");
const router = express.Router();
/**
 * Express router for /toppic
 *
 * Render a toppic task configure web page back to user
 */
const toppic = router.get('/toppic', function (req, res) {
    if (req.session.passport === undefined) {
        res.write("Please log in first to use topic for your projecct");
        res.end();
    }
    else {
        //console.log(req.session.passport);
        //console.log(req.query.projectCode);
        let projectCode = req.query.projectCode;
        if (!projectCode) {
            res.write("No project selected for this topic task.");
            return;
        }
        else {
            res.render('pages/topicTask', { projectCode });
        }
    }
});
module.exports = toppic;
