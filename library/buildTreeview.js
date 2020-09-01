const BetterDB = require("better-sqlite3");
const getProjectNew = require("./getProjectNew");
const getExperiment = require("./getExperiment");
const getDataset = require("./getDataset");

function buildTreeview(uid) {
    let projects = getProjectNew(uid);
    console.log("projects: ", projects);
    let result = [];
    if (!projects) {
        return result;
    }
    for (let i = 0; i < projects.length; i++) {
        let newPNode = {};
        newPNode.text = projects[i].projectName;
        newPNode.href = "pid#" + projects[i].pid;
        result.push(newPNode);
        let experiments = getExperiment(uid, projects[i].pid);
        if (experiments.length === 0) continue;
        newPNode.nodes = [];
        for (let j = 0; j < experiments.length; j++) {
            let newENode = {};
            newENode.text = experiments[j].ename;
            newENode.href = "eid#" + experiments[j].eid;
            newPNode.nodes.push(newENode);
            let datasets = getDataset(experiments[j].eid);
            if (datasets.length === 0) continue;
            newENode.nodes = [];
            for (let k = 0; k < datasets.length; k++) {
                let newDNode = {};
                newDNode.text = datasets[k].dname;
                newDNode.href = "datasetID#" + datasets[k].datasetID;
                newENode.nodes.push(newDNode);
            }
        }

    }
    console.log("result: ", JSON.stringify(result));
    return JSON.stringify(result);


}

module.exports = buildTreeview;