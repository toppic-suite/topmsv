var express = require("express");
var router = express.Router();
var insertDataset = require("../library/insertDataset");


var newDataset = router.post('/newDataset', function (req,res) {
    console.log("Hello, newProject!");
    const uid = req.session.passport.user.profile.id;
    const eid = req.query.eid;
    const dname = req.query.dname;
    const description = req.query.description;
    insertDataset(eid, dname, description);
    res.end();
});

module.exports = newDataset;