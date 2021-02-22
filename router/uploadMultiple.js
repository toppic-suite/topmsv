/**
 * Express router for /uploadMultiple
 *
 * Decompress zip file and upload multiple mzML files to target directory
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
const unzipper = require('unzipper');
const os = require('os');

const uploadMultiple = router.post('/uploadMultiple', function (req, res) {
    console.log("hello,uploadMultiple");
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

        let write_contents = "file.path: " + file.path + " form.uploadDir: " + form.uploadDir
                fs.writeFile("file_name.txt", write_contents, function (err) {
                    if (err) return console.log(err);
                });

        fs.createReadStream(file.path)
            .pipe(unzipper.Extract({ path: form.uploadDir }).on('close', function(){
                fs.unlinkSync(file.path);
                
                //iterate over files, if mzML file, create a new project folder and move the file
                //and process the file
                let fileNames = fs.readdirSync(form.uploadDir);
                fileNames.forEach(file => {
                    let mzmlFile = form.uploadDir + "/" + file;

                    let folderid = uuidv1();
                    let des_path = "data/" + folderid + "/";
                    let des_file = "data/" + folderid + "/" + file;

                    if (!fs.existsSync(des_path)) {
                        console.log('The path does not exist.');
                        fs.mkdirSync(des_path);
                        console.log('Path created: ',des_path);
                    }

                    fs.rename(mzmlFile, des_file, function (err) {
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
                                if(!result) {
                                    insertRowSync(id, projectname, file,description,des_file,4, emailtosend,0,0,0,0,uid,publicStatus, "true");
                                    //create path based on OS type    
                                    let app = './cpp/bin/mzMLReader';

                                    if (os.platform() == "win32"){
                                        app = '.\\cpp\\bin\\mzMLReader';
                                    }
                                    let parameter = des_file + ' -f';
                                    submitTask(id, app, parameter, 1);
                                    break;
                                }
                            }
                        })
                    })
                })    
                message.text = "Project Name: " + projectname + "\nFile Name: " + fname + "\nStatus: Processing\nOnce data processing is done, you will receive a link to review your result.";
                message.subject = "Your data has been uploaded, please wait for processing";
                message.to = emailtosend;
                transport.sendMail(message, function(err, info) {
                    if (err) {
                        console.log(err)
                    } 
                    else {
                        console.log(info);
                    }
                });
                res.end();  
            })
        );
    })
});

const transport = nodemailer.createTransport({
    host: "smtp-mail.outlook.com", // hostname
    secureConnection: false, // TLS requires secureConnection to be false
    port: 587, // port for secure SMTP
    tls: {
        ciphers:'SSLv3'
    },
    auth: {
        user: 'datalink_sender@outlook.com',
        pass: 'iupuiSOICWK316'
    }
});

const message = {
    from: 'datalink_sender@outlook.com', // Sender address
    to: 'default@gmail.com',         // List of recipients
    subject: 'Default Subject', // Subject line
    text: 'Default text' // Plain text body
};

module.exports = uploadMultiple;