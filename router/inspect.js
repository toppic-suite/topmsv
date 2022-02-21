const express = require("express");
const router = express.Router();

const inspect = router.get('/inspect', function (req, res) {
    console.log("hello inspect!");
    res.redirect('/resources/topview/inspect/spectrum_no_nav.html');
})
module.exports = inspect;