var express = require("express");
var router = express.Router();
const getProjectNew = require("../library/getProjectNew");

var projects = router.get('/projectTab', function (req,res) {
    //console.log('Cookies: ', req.cookies);
    //console.log('Session:', req.session);
    //console.log(req.session.passport.user.profile);
    //console.log(req.session);
    //let uid = req.session.passport.user.profile.uid;
    console.log("hello projectTab");
    if (req.session.passport === undefined)
        res.render('pages/projects', {
            projects: []
        });
    else {
        //console.log(req.session.passport.user.profile);
        let uid = req.session.passport.user.profile.id;
        console.log(uid);
        let rows = getProjectNew(uid);
        rows.forEach(row=>{
            row.link = '/experimentManagement?pid=' + row.pid;
        })
        res.render('pages/projectTab', {
            projects: rows
        });
    }
});

module.exports = projects;