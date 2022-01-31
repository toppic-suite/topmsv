const express = require("express");
const router = express.Router();
const BetterDB = require("better-sqlite3");
const getProjectNew = require("../library/getProjectNew");
const getExperiment = require("../library/getExperiment");
const buildProjectView = require("../library/buildProjectView");

/**
 * Express.js router for /projectview. Unfinished
 * 
 * Render project share page to users
 */

const projectview = router.get('/projectview', function (req,res) {
    console.log("hello projectview");
    const pid = req.query.pid;

    let resultDb = new BetterDB("./db/projectDB.db");
    let stmt = resultDb.prepare(`SELECT *
                FROM Project
                WHERE pid = ?;`);
    let projectInfo = stmt.get(pid);
    // resultDb.close();
    console.log(projectInfo);

    if (!projectInfo) {
        res.write("Invalid project ID!");
        res.end();
        return;
    }

    let projectPermission = projectInfo.permission;
    let projectUid = projectInfo.uid;

    let node = buildProjectView(pid);
    console.log("node:", node);

    if (!node) {
        res.write("Invalid project ID!");
        res.end();
        return;
    }

    if (req.session.passport === undefined){
        if (projectPermission === 0) {
            res.render('pages/projectShare', {
                info: uid,
                projectList: projectList
            });
        }

        if (projectPermission === 1) {
            if (!req.session.passport) {
                let uid = req.session.passport.user.profile.id;
                if (uid === projectUid) {
                    res.render();
                }
            } else {
                // Deny
            }
        }

        if (projectPermission === 2) {
            console.log("not owner!");
            res.render('pages/projectShare', {
                password: projectInfo.password,
                treeviewNode: node
            });

            /*if (!req.session.passport) {
                let uid = req.session.passport.user.profile.id;
                if (uid === projectUid) {
                    // render
                }
            }*/
            // ask password
        }
    }
    else {
        //console.log(req.session.passport.user.profile);
        let uid = req.session.passport.user.profile.id;
        // console.log(pid);

        if(uid === projectUid) {
            console.log("owner!");
            res.render('pages/projectShare', {
                treeviewNode: node
            });
        }
    }
});

module.exports = projectview;