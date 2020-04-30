/**
 * Express router for /submit
 * send submit.html page to user
 */
var express = require("express");
var router = express.Router();
var path = require("path");

var submit = router.get('/submit', function (req, res) {
    res.sendFile( path.resolve(__dirname + "/../public/submit.html") );
});

module.exports = submit;