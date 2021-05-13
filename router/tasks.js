const express = require("express");
const router = express.Router();
const getProjects = require("../library/getProjects");
const getTasksPerUser = require("../library/getTasksPerUser");
const checkUser = require("../library/checkUser");
const path = require("path");
/**
 * Express.js router for /tasks
 * 
 * Render task list page for user by given user ID
 */
const projects = router.get('/tasks', async (req,res) => {
    //console.log('Cookies: ', req.cookies);
    //console.log('Session:', req.session);
    //console.log(req.session.passport.user.profile);
    //console.log(req.session);
    //let uid = req.session.passport.user.profile.uid;
    console.log("hello tasks");
    if (req.session.passport === undefined)
        res.render('pages/tasks', {
            taskData: []
        });
    else {
        //console.log(req.session.passport.user.profile);
        let uid = req.session.passport.user.profile.id;
        let userInfo = checkUser(uid);
        let totalTaskData = [];
        if(!userInfo) {
            res.write("User does not exist in the system! Please log in first!");
            res.end();
            return;
        }
        // console.log(uid);
        let projectData = loadProjectData(uid);
        projectData.then(function (rows) {
            return loadTaskData(rows, totalTaskData);
        }).then(function(taskData) {
            res.render('pages/tasks', {
                taskData: taskData
            });
        }).catch(function () {
            console.log("error loading task data for tasks page");
        });
    }
});
let loadProjectData = (uid) => {
    return new Promise((resolve, reject) => {
        getProjects(uid, function (rows) {
            if (rows) {
                resolve(rows);
            }
            else{
                reject();
            }
        })
    })
}
let readOneTask = (project) => {
    return new Promise((resolve, reject) => {
        let data = [];
        getTasksPerUser(project.projectCode, function(taskData) {
            taskData.forEach(task =>{
                if (task.app != "node") {
                    let appName = path.basename(task.app);
                    if(task.status === 0) {
                        task.status = appName + ' processing';
                    } else if(task.status === 1) {
                        task.status = appName + ' finished';
                    } else if(task.status === 2) {
                        task.status = appName + ' failed';
                    } else if(task.status === 3) {
                        task.status = 'Project removed';
                    } else if(task.status ===4) {
                        task.status = appName + ' waiting';
                    }
                    task.projectCode = project.projectCode;
                    task.projectName = project.projectName;
                    task.fileName = project.fileName;
                    task.description = project.description;
                    task.uploadTime = project.uploadTime;
                    task.projectLink = '/data?id=' + project.projectCode;
                    data = data.concat(task);
                }
            });
            resolve(data);
        });
    })
}
let loadTaskData = async (projectData) => {
    let totalTask = [];
    for (let i = 0; i < projectData.length; i++) {
        let project = projectData[i];
        totalTask = totalTask.concat(await readOneTask(project));
    }
    return totalTask;
}

module.exports = projects;