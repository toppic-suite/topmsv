"use strict";
// /**
//  * Check if file has been modified.
//  * @param {string} dir - Project directory
//  * @param {string} fileName - Name of a file to read
//  * @param {function} callback - Callback function that handles query results.
//  * @returns {function} Callback function
//  */
// const fs = require('fs');
// const path = require('path');
// function checkFileStatus(fileName, callback) {
//     let isFileModified = "false";
//     let fileNames = fileName.split(",");
//     console.log(fileNames);
//     try{
//         for (let i = 0; i < fileNames.length; i++) {
//             let file = fileNames[i];
//             let filePath = path.join("log", file);
//             if (fs.existsSync(filePath)) {
//                 fs.watch(filePath, (eventType, name) => {
//                     console.log(filePath, "modified")
//                     isFileModified = "true";
//                     callback(null, isFileModified);
//                 })    
//             }
//         }
//     }catch (error) {
//         console.log("error", error);
//         callback(error, null);
//     }
// }
// module.exports = checkFileStatus;
