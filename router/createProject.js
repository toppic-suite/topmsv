"use strict";
const express = require("express");
const router = express.Router();
/**
 * Express.js Router for /createProject
 *
 * Render createProject page to user
 */
let createProject = router.get('/createProject', function (req, res) {
    //console.log('Cookies: ', req.cookies);
    //console.log('Session:', req.session);
    //console.log(req.session.passport.user.profile);
    //console.log(req.session);
    //let uid = req.session.passport.user.profile.uid;
    console.log("hello createProject");
    if (req.session.passport === undefined)
        res.render('pages/projects', {
            projects: []
        });
    else {
        //console.log(req.session.passport.user.profile);
        let uid = req.session.passport.user.profile.id;
        // console.log(uid);
        res.render('pages/createProject', {
            info: uid
        });
    }
});
module.exports = createProject;
