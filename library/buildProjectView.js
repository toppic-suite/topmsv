const BetterDB = require("better-sqlite3");
const getExperimentByPid = require("./getExperimentByPid");
const getDataset = require("./getDataset");

/**
 * Build tree view for projects
 * @param {number} pid - Project ID
 * @returns {string} Tree view contains experiments and datasets
 */
function buildProjectView(pid) {
    /*let result = [];
    let experiments = getExperimentByPid(pid);
    if (experiments.length === 0) {
        // NO experiments

    }
    for (let i = 0; i < experiments.length; i++) {
        let newENode = {};
        newENode.text = experiments[i].ename;
        newENode.href = "eid#" + experiments[i].eid;
        result.push(newENode);
        let datasets = getDataset(experiments[i].eid);
        if (datasets.length === 0) continue;
        newENode.nodes = [];
        for (let j = 0; j < datasets.length; j++) {
            let newDNode = {};
            newDNode.text = datasets[j].dname;
            newDNode.href = "datasetID#" + datasets[j].datasetID;
            newENode.nodes.push(newDNode);
        }
    }

    console.log("result: ", JSON.stringify(result));
    return JSON.stringify(result);*/
}

module.exports = buildProjectView;