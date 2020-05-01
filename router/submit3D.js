/**
 * Express router for /submit3D
 * send submit3D.html page to user
 */
var express = require("express");
var router = express.Router();
var path = require("path");

var submit3D = router.get('/submit3D', function (req, res) {
    res.sendFile( path.resolve(__dirname + "/../public/submit3D.html") );
});

module.exports = submit3D;