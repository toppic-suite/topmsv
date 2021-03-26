/**
 * Express router for /upload
 *
 * Save mzML file and env file (optional) to target directory
 * and save project information into project database,
 * then submit task to task scheduler
 */
const express = require("express");
const router = express.Router();
const insertRowSync = require("../library/insertRowSync");
const insertDataset = require("../library/insertDataset");
const submitTask = require("../library/submitTask");
const makeid = require("../library/makeid");
const ifExists = require("../library/ifExists");
const BetterDB = require('better-sqlite3');
const nodemailer = require('nodemailer');
const fs = require('fs');
const formidable = require('formidable');
const uuidv1 = require('uuid/v1');
const sqlite3 = require('sqlite3').verbose();

const upload = router.post('/upload', function (req, res) {
    console.log("hello,upload");
    let uid = req.session.passport.user.profile.id;
    let resultDb = new BetterDB('./db/projectDB.db');
    let stmt = resultDb.prepare(`SELECT email AS email
                                FROM Users
                                WHERE uid = ?;`);
    let queryResult = stmt.get(uid);
    resultDb.close();
    let email;
    if (!queryResult) {
        console.log("Upload files failed, no corresponding email address!");
        return;
    } else {
        email = queryResult.email;
    }
    let form = new formidable.IncomingForm();
    form.maxFileSize = 5000 * 1024 * 1024; // 5gb file size limit
    form.encoding = 'utf-8';
    form.uploadDir = "tmp";
    form.keepExtensions = true;
    form.parse(req, function (err, fields, files) {
        if (err) {
            console.log(err);
        }
        let projectname = fields.projectname;
        let emailtosend = email;
        let description = fields.description;
        let publicStatus = fields.public;
        let file = files.dbfile;
        let eid = fields.eid;
        let fname = file.name;
        let envFile1 = files.envfile1;
        let txtFile = files.txtfile;
        // console.log(txtFile);
        // let envFile2 = files.envfile2;
        let folderid = uuidv1();
        let des_path = "data/" + folderid + "/";
        let des_file = "data/" + folderid + "/" + fname;
        // let des_envFile1 = "data/" + folderid + "/" + "ms1.env";
        // let des_envFile2 = "data/" + folderid + "/" + "ms2.env";
        // Generate new path for file
        if (!fs.existsSync(des_path)) {
            console.log('The path does not exist.');
            fs.mkdirSync(des_path);
            console.log('Path created: ',des_path);
        }
        if(txtFile !== undefined) {
            let des_txtFile = "data/" + folderid + "/" + txtFile.name;
            let scan_level = fields.scan_level;
            let prec_mz = fields.prec_mz;
            let prec_charge = fields.prec_charge;
            let prec_inte = fields.prec_inte;
            // console.log(scan_level, prec_mz, prec_charge, prec_inte);
            fs.rename(txtFile.path, des_txtFile, function (err) {
                if (err) {
                    console.log(err);
                    return res.send({"error": 403, "message": "Error on saving file!"});
                }

                let adr =  'https://toppic.soic.iupui.edu/data?id=';

                let id = makeid(11);

                ifExists(id, function (err, result) {
                    if(err) {
                        console.log(err);
                    }
                    while (true) {
                        // console.log(result);
                        if(!result) {
                            insertRowSync(id, projectname, txtFile.name, description, des_txtFile, 4, emailtosend, 0, 0, 0, 0, uid, publicStatus, "true");
                            // insertDataset(eid, projectname, description, projectsID);
                            message.text = "Project Name: " + projectname + "\nFile Name: " + txtFile.name + "\nStatus: Processing\nOnce data processing is done, you will receive a link to review your result.";
                            message.subject = "Your data has been uploaded, please wait for processing";
                            message.to = emailtosend;
                            transport.sendMail(message, function(err, info) {
                                if (err) {
                                    console.log(err)
                                } else {
                                    console.log(info);
                                }
                            });

                            let dbpath = des_txtFile.substr(0,des_txtFile.lastIndexOf('.')) + '.db';

                            let betterDB = new BetterDB('./' + dbpath);
                            const stmtCreateSpectraTable = betterDB.prepare('CREATE TABLE IF NOT EXISTS `SPECTRA` (\n' +
                                '\t`ID`\tINTEGER NOT NULL DEFAULT 1,\n' +
                                '\t`SCAN`\tINTEGER NOT NULL DEFAULT 1,\n' +
                                '\t`RETENTIONTIME`\tREAL NOT NULL DEFAULT 0,\n' +
                                '\t`SCANLEVEL`\tINTEGER NOT NULL DEFAULT 1,\n' +
                                '\t`PREC_MZ`\tREAL NOT NULL DEFAULT 0,\n' +
                                '\t`PREC_CHARGE`\tINTEGER NOT NULL DEFAULT 0,\n' +
                                '\t`PREC_INTE`\tREAL NOT NULL DEFAULT 0,\n' +
                                '\t`PEAKSINTESUM`\tREAL DEFAULT 0,\n' +
                                '\t`NEXT`\tINTEGER NOT NULL DEFAULT 0,\n' +
                                '\t`PREV`\tINTEGER NOT NULL DEFAULT 0,\n' +
                                '\tPRIMARY KEY(`ID`)\n' +
                                ');');
                            stmtCreateSpectraTable.run();
                            const stmtCreatePeaksTable = betterDB.prepare('CREATE TABLE IF NOT EXISTS `PEAKS` (\n' +
                                '\t`id`\tINTEGER,\n' +
                                '\t`mz`\tREAL,\n' +
                                '\t`intensity`\tREAL,\n' +
                                '\t`SPECTRAID`\tINTEGER NOT NULL DEFAULT 1,\n' +
                                '\tPRIMARY KEY(`id`),\n' +
                                '\tFOREIGN KEY(`SPECTRAID`) REFERENCES `SPECTRA`(`ID`)\n' +
                                ');');
                            stmtCreatePeaksTable.run();

                            // const stmtCreatePairTable = betterDB.prepare(`CREATE TABLE IF NOT EXISTS `ScanPairs` ( `LevelOneScanID ')
                            let stmtInsertSpectra = betterDB.prepare('INSERT INTO SPECTRA(ID,SCAN,RETENTIONTIME,SCANLEVEL,PREC_MZ,PREC_CHARGE,PREC_INTE,PEAKSINTESUM,NEXT,PREV) VALUES(?,?,?,?,?,?,?,?,?,?)');
                            stmtInsertSpectra.run(1,1,0,scan_level,prec_mz,prec_charge,prec_inte,0,0,0);

                            let app = 'node';
                            let parameter = './utilities/convertTxt.js ' + dbpath + ' ' + des_txtFile;
                            submitTask(id, app, parameter, 1);

                            res.end();
                            break;
                        }
                    }
                });

                let response = {
                    message:'File uploaded successfully',
                    // filename:fname,
                    projectname:projectname,
                    link:message.text,
                    email: emailtosend
                };
                //console.log(response);
                res.write(JSON.stringify( response ));
                res.end();
                return;
            })
        } else {
            if(envFile1 !== undefined) { // process mzML file and envelope file
                let des_envFile1 = "data/" + folderid + "/" + envFile1.name;
                fs.rename(envFile1.path, des_envFile1, function (err) {
                    if (err) {
                        console.log(err);
                        return res.send({"error": 403, "message": "Error on saving file!"});
                    }
                    fs.rename(file.path, des_file, function (err) {
                        if(err) {
                            console.log(err);
                            return res.send({"error": 403, "message": "Error on saving file!"});
                        }
                        let adr =  'https://toppic.soic.iupui.edu/data?id=';

                        let id = makeid(11);

                        ifExists(id, function (err, result) {
                            if(err) {
                                console.log(err);
                            }
                            while (true) {
                                // console.log(result);
                                if(!result) {
                                    insertRowSync(id, projectname, fname, description,des_file,4, emailtosend,1,0,0, envFile1.name,uid,publicStatus, "true");
                                    // insertDataset(eid, projectname, description, projectsID);
                                    message.text = "Project Name: " + projectname + "\nFile Name: " + fname + "\nStatus: Processing\nOnce data processing is done, you will receive a link to review your result.";
                                    message.subject = "Your data has been uploaded, please wait for processing";
                                    message.to = emailtosend;
                                    transport.sendMail(message, function(err, info) {
                                        if (err) {
                                            console.log(err)
                                        } else {
                                            console.log(info);
                                        }
                                    });

                                    let app = './cpp/bin/mzMLReader';
                                    let parameter = des_file + ' -f';
                                    submitTask(id, app, parameter,1);

                                    app = 'node';
                                    let dbDir = des_file.substr(0, des_file.lastIndexOf(".")) + ".db";
                                    parameter = './utilities/convertEnv ' + dbDir + ' ' + des_envFile1;
                                    submitTask(id, app, parameter, 1);

                                    res.end();
                                    break;
                                }
                            }
                        });

                        let response = {
                            message:'File uploaded successfully',
                            filename:fname,
                            projectname:projectname,
                            link:message.text,
                            email: emailtosend
                        };
                        //console.log(response);
                        res.write(JSON.stringify( response ));
                    });
                })
            } else { // only process mzML file
                fs.rename(file.path, des_file, function (err) {
                    if(err) {
                        console.log(err);
                        return res.send({"error": 403, "message": "Error on saving file!"});
                    }
                    let adr =  'https://toppic.soic.iupui.edu/data?id=';
                    let id = makeid(11);

                    ifExists(id, function (err, result) {
                        if(err) {
                            console.log(err);
                        }
                        while (true) {
                            // console.log(result);
                            if(!result) {
                                insertRowSync(id, projectname, fname,description,des_file,4, emailtosend,0,0,0,0,uid,publicStatus, "true");
                                // insertDataset(eid, projectname, description, projectsID);
                                message.text = "Project Name: " + projectname + "\nFile Name: " + fname + "\nStatus: Processing\nOnce data processing is done, you will receive a link to review your result.";
                                message.subject = "Your data has been uploaded, please wait for processing";
                                message.to = emailtosend;
                                transport.sendMail(message, function(err, info) {
                                    if (err) {
                                        console.log(err)
                                    } else {
                                        console.log(info);
                                    }
                                });

                                let app = './cpp/bin/mzMLReader';
                                let parameter = des_file + ' -f';
                                submitTask(id, app, parameter, 1);

                                res.end();
                                break;
                            }
                        }
                    });

                    let response = {
                        message:'File uploaded successfully',
                        filename:fname,
                        projectname:projectname,
                        link:message.text,
                        email: emailtosend
                    };
                    //console.log(response);
                    res.write(JSON.stringify( response ));
                    return;
                });
            }
        }
    })
});

const transport = nodemailer.createTransport({
    //host: "smtp-mail.outlook.com", // hostname
    host: "smtp.office365.com", // hostname
    secureConnection: false, // TLS requires secureConnection to be false
    port: 587, // port for secure SMTP
    tls: {
        ciphers:'SSLv3'
    },
    auth: {
        //user: 'datalink_sender@outlook.com',
        //pass: 'iupuiSOICWK316'
        user: 'topmsv@outlook.com',
        pass: 'iupuiSOIC'
    }
});

const message = {
    //from: 'datalink_sender@outlook.com', // Sender address
    from: 'topmsv@outlook.com',
    to: 'default@gmail.com',         // List of recipients
    subject: 'Default Subject', // Subject line
    text: 'Default text' // Plain text body
};

module.exports = upload;