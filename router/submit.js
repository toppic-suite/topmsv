const express = require("express");
const router = express.Router();
const path = require("path");

/**
 * Express router for /submit
 * send submit.html page to user
 */
const submit = router.get('/submit', function (req, res) {
    res.sendFile( path.resolve(__dirname + "/../public/submit.html") );
});

module.exports = submit;