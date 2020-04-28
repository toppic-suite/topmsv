/**
 * Express router for /logout
 *
 * clear session and redirect to home page
 */
var express = require("express");
var router = express.Router();

var logout = router.get('/logout',(req, res)=> {
    req.logout();
    //req.session.destroy();
    req.session = null;
    res.redirect('/');
});

module.exports = logout;