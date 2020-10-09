const express = require("express");
const router = express.Router();
const path = require("path");
const checkUser = require("../library/checkUser");
/**
 * Express router for /submit
 * send submit.html page to user
 */
const submit = router.get('/submit', function (req, res) {
    console.log("hello submit!");
    if (req.session.passport === undefined) {
        res.write("User does not exist in the system! Please log in first!");
        res.end();
        return;
    }
    else {
        let uid = req.session.passport.user.profile.id;
        let userInfo = checkUser(uid);
        if(!userInfo) {
            res.write("User does not exist in the system! Please log in first!");
            res.end();
            return;
        }
        res.sendFile( path.resolve(__dirname + "/../public/submit.html") );
    }
});

module.exports = submit;