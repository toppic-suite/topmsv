var express = require("express");
var router = express.Router();
const buildTreeview = require("../library/buildTreeview");

var test = router.get('/test', function (req,res) {
    console.log("hello test");
    if (req.session.passport === undefined)
        console.log("undefined passport");
    else {
        //console.log(req.session.passport.user.profile);
        let uid = req.session.passport.user.profile.id;
        console.log(uid);
        let result = buildTreeview(uid);
        res.write(result);
    }
    res.end();
});

module.exports = test;