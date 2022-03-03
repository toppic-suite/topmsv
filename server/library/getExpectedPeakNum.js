"use strict";
const fs = require('fs');
const path = require('path');

/**
 * Read init.ini and return the value set as the expected peak number
 * @returns {function} Callback
 * @async
 */
function getExpectedPeakNum(callback) {
    let configFileName=path.join("config", "init.ini");
    fs.readFile(configFileName, 'utf8', (err, data) => {
        if (err) {
            console.error(err);
            return;
        }
        let parameters = data.toString().split("\n");
        console.log("parameters[1]", parameters[1]);
        return callback(null, parameters[1]);
    });
}
module.exports = getExpectedPeakNum;
