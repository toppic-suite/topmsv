// const express = require("express");
// const router = express.Router();
// const checkFileStatusLib = require("../library/checkFileStatus");

// /**
//  * Express.js router for /checkFileStatus
//  * Return contents of a log file for each task
//  */
// const checkFileStatus = router.get('/checkFileStatus', function(req, res) {
//     console.log("Hello, checkFileStatus!");
//     const fileName = req.query.fileName;
//     checkFileStatusLib(fileName, function (err, data) {
//         if (err) {
//             res.write(err);
//         }
//         else{
//             res.write(data);
//         }
//         res.end();
//     })
// });
// module.exports = checkFileStatus;