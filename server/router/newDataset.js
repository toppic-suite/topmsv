"use strict";
const express = require("express");
const router = express.Router();
const insertDataset = require("../library/insertDataset");
/**
 * Express.js router for /newDataset
 *
 * Create a new dataset under specific experiment with given experiment ID and dataset information
 */
const newDataset = router.post('/newDataset', function (req, res) {
    console.log("Hello, newProject!");
    const uid = req.session.passport.user.profile.id;
    const eid = req.query.eid;
    const dname = req.query.dname;
    const description = req.query.description;
    insertDataset(eid, dname, description);
    res.end();
});
module.exports = newDataset;
