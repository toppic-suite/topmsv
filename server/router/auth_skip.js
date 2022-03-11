"use strict";
const express = require("express");
const router = express.Router();
const passport = require('passport');
const insertUser = require('../library/insertUser');
const checkUser = require('../library/checkUser.js');
/**
 * Express.js router for /auth/google
 */
let auth_skip = router.get('/auth/skip', passport.authenticate('custom', { failureRedirect: '/' }), function (req, res) {
    let profile = req.user.profile;
    req.session.token = req.user.token;
    if (checkUser(profile.id) == "undefined" || checkUser(profile.id) == undefined) {
        insertUser(profile.id, profile.emails[0].value, profile.name.givenName, profile.name.familyName, profile.displayName);
    }
    res.redirect('/');
});
module.exports = auth_skip;
