"use strict";
const express = require("express");
const router = express.Router();
const fs = require("fs");
/**
 * Express router for /logout
 *
 * clear session and redirect to home page
 */
const logout = router.get('/logout', (req, res) => {
    req.logout();
    //req.session.destroy();
    req.session = null;
    res.redirect('/');
});
module.exports = logout;
