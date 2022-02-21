"use strict";
const checkProjectStatusSync = require("./checkProjectStatusSync");
const updateProjectStatusSync = require("./updateProjectStatusSync");
const insertTaskSync = require("./insertTaskSync");
/**
 * Submit a task to task scheduler. Sync Mode.
 * @param {string} projectCode - Project code
 * @param {string} app - Application name
 * @param {string} parameter - Parameter for app
 * @param {number} threadNum - The number of threads to run the app
 */
function submitTask(projectCode, app, parameter, threadNum) {
    let queryResult = checkProjectStatusSync(projectCode);
    if (queryResult === undefined) {
        updateProjectStatusSync(4, projectCode);
        insertTaskSync(projectCode, app, parameter, threadNum, 0);
    }
    else if (queryResult.projectStatus === 2 || queryResult.projectStatus === 3) {
        return;
    }
    else if (queryResult.projectStatus === 0) {
        insertTaskSync(projectCode, app, parameter, threadNum, 0);
    }
    else {
        updateProjectStatusSync(4, projectCode);
        insertTaskSync(projectCode, app, parameter, threadNum, 0);
    }
}
module.exports = submitTask;
