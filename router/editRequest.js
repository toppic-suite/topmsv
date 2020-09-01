var express = require("express");
var router = express.Router();
const BetterDB = require("better-sqlite3");

var editRequest = router.get('/editRequest', function (req,res) {
    //console.log('Cookies: ', req.cookies);
    //console.log('Session:', req.session);
    //console.log(req.session.passport.user.profile);
    //console.log(req.session);
    //let uid = req.session.passport.user.profile.uid;
    console.log("hello editRequest");
    if (req.session.passport === undefined)
    {
        console.log("no passport!");
        res.end();
    }
    else {
        //console.log(req.session.passport.user.profile);
        let uid = req.session.passport.user.profile.id;
        const type = req.query.type;
        const id = req.query.id;
        let name, description;
        console.log("type:", type);
        console.log("id:", id);
        if (type === 'pid') {
            let resultDb = new BetterDB("./db/projectDB.db");
            let stmt = resultDb.prepare(`SELECT pid as pid, pname as projectName, description AS description
                FROM Project
                WHERE pid = ?;`);
            let queryResult = stmt.get(id);
            resultDb.close();
            name = queryResult.projectName;
            description = queryResult.description;
        }
        if (type === 'eid') {
            let resultDb = new BetterDB("./db/projectDB.db");
            let stmt = resultDb.prepare(`SELECT ename as ename, description AS description
                FROM Experiment
                WHERE eid = ?;`);
            let queryResult = stmt.get(id);
            resultDb.close();
            name = queryResult.ename;
            description = queryResult.description;
        }
        if (type === 'datasetID') {
            let resultDb = new BetterDB("./db/projectDB.db");
            let stmt = resultDb.prepare(`SELECT Dataset.dname as dname, Dataset.description AS description, Projects.ProjectCode AS projectCode
                FROM Dataset INNER JOIN Projects ON Dataset.projectsID = Projects.ProjectID
                WHERE Dataset.datasetID = ?;`);
            let queryResult = stmt.get(id);
            resultDb.close();
            name = queryResult.dname;
            description = queryResult.description;
        }
        res.render('pages/editPage', {
            typePlaceholder: type,
            idPlaceholder: id,
            namePlaceholder: name,
            descriptionPlaceholder: description
        });
    }
});

module.exports = editRequest;