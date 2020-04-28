const updateProjectStatusSync = require("../library/updateProjectStatusSync");
const getProjectSummary = require("../library/getProjectSummary");
const rimraf = require("rimraf");

/**
 * Delete project by given projectCode. Sync mode.
 * @param {string} projectCode
 */
function deleteProject(projectCode) {
    updateProjectStatusSync(3, projectCode);
    getProjectSummary(projectCode, function (err, row) {
        let projectDir = row.projectDir;
        let dir = projectDir.substr(0, projectDir.lastIndexOf("/"));
        rimraf(dir, [],function () { console.log("Remove Project " + projectCode); });
    });
}

module.exports = deleteProject;