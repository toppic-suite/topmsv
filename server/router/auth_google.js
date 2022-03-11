"use strict";
const express = require("express");
const router = express.Router();
const passport = require('passport');
/**
 * Express.js router for /auth/google
 */
let auth_google = router.get('/auth/google', passport.authenticate('google', {
    scope: ['https://www.googleapis.com/auth/userinfo.profile', 'https://www.googleapis.com/auth/userinfo.email']
}));
module.exports = auth_google;
