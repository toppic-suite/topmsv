"use strict";
/**
 * Get contents of a log file for given task.
 * @param {string} dir - Project directory
 * @param {string} fileName - Name of a file to read
 * @param {function} callback - Callback function that handles query results.
 * @returns {function} Callback function
 */
const fs = require('fs');
const path = require('path');
function getStatusLog(fileName, callback) {
    try {
        let data = fs.readFileSync(path.join("log", fileName), { encoding: 'utf8' });
        callback(null, data);
    }
    catch (error) {
        callback(error, null);
    }
}
module.exports = getStatusLog;
