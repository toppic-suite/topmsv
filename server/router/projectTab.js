"use strict";
const express = require("express");
const router = express.Router();
const getProjectNew = require("../library/getProjectNew");
/**
 * Express.js router for /projectTab
 *
 * Render project tabs page to users
 */
const projects = router.get('/projectTab', function (req, res) {
    //console.log('Cookies: ', req.cookies);
    //console.log('Session:', req.session);
    //console.log(req.session.passport.user.profile);
    //console.log(req.session);
    //let uid = req.session.passport.user.profile.uid;
    console.log("hello projectTab");
    if (req.session.passport === undefined)
        res.render('pages/projects', {
            projects: []
        });
    else {
        //console.log(req.session.passport.user.profile);
        let uid = req.session.passport.user.profile.id;
        console.log(uid);
        let rows = getProjectNew(uid);
        if (!rows) {
            res.write("Cannot connect to project DB");
            res.end();
            return;
        }
        rows.forEach(row => {
            row.link = '/experimentManagement?pid=' + row.pid;
        });
        res.render('pages/projectTab', {
            projects: rows
        });
    }
});
module.exports = projects;
