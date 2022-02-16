"use strict";
/**
 * Express router for /auth/google/callback
 *
 * authenticate users by google, if there is a new user, then insert user information into Users table of database
 */
const express = require("express");
const router = express.Router();
const passport = require('passport');
const insertUser = require('../library/insertUser');
let auth_google_callback = router.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/' }), function (req, res) {
    //console.log('req.user.token',req.user.profile);
    let profile = req.user.profile;
    req.session.token = req.user.token;
    insertUser(profile.id, profile.emails[0].value, profile.name.givenName, profile.name.familyName, profile.displayName);
    res.redirect('/');
});
module.exports = auth_google_callback;
