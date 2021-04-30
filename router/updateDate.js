const express = require("express");
const router = express.Router();
const updateExpDateLib = require("../library/updateExpDate");

/**
 * Express.js router for /updateDate
 */
const updateDate = router.get('/updateDate', function (req,res) {
    console.log("hello updateDate");
    let projectCode = req.query.pcode;
    updateExpDateLib(projectCode, function (msg) {
        if (msg == "success") {
            res.render('pages/dateUpdateSuccess');
            res.end();
        }
        else{
            console.log(msg);
            res.end();
        }
    });
    
});

module.exports = updateDate;