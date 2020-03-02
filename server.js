var fs = require('fs');
var nodemailer = require('nodemailer');
var favicon = require('serve-favicon');
const sqlite3 = require('sqlite3').verbose();
var bodyParser = require('body-parser');
var Papa = require('papaparse');
var compression = require('compression');
var helmet = require('helmet');
var express = require('express');
var cookieParser = require('cookie-parser');
var cookieSession = require('cookie-session');
var passport = require('passport');
const auth = require('./auth');
var app = express();
app.use(helmet());
app.use(cookieSession({
    name:'session',
    keys:['4324']
}));
app.use(cookieParser());
auth(passport);
app.use(passport.initialize());

const uuidv1 = require('uuid/v1');
var formidable = require('formidable');
const { execFile } = require('child_process');
const CronJob = require('cron').CronJob;
const molecularFormulae = require('./distribution_calc/molecularformulae');
const calcDistrubution = new molecularFormulae();
const BetterDB = require('better-sqlite3');

const job = new CronJob('00 00 00 * * *', function() {
    const d = new Date();
    console.log('Check expired projects:', d);
    checkExpiredProj(db, function (err, rows) {
        rows.forEach(element => {
            fs.unlink(element.dir, (err) => {
                if (err) throw err;
                console.log(`${element.fileName} was deleted`);
            });
            let dbDir = element.dir.substr(0, element.dir.lastIndexOf(".")) + ".db";
            fs.unlink(dbDir, (err) => {
                if (err) throw err;
                console.log(`${dbDir} was deleted`);
            });
            updateProjectStatus(db, 3, element.pcode,function(err){
                console.log(`${element.pcode} status has been updated`);
            });
        });
    });
});
job.start();

// set the view engine to ejs
app.set('view engine', 'ejs');
app.use(compression());

// set favicon using express middleware
app.use(favicon(__dirname + '/public/image/favicon.ico'));

app.use(bodyParser.urlencoded({ extended: false }));

app.get('/', function (req, res) {
    if (req.session.token) {
        res.cookie('token', req.session.token);
    }else {
        res.cookie('token', '');
    }
    getProjectsGuest(db,function (rows) {
        rows.forEach(row=>{
            if(row.envelopeFile === '0') row.envelopeFile = 'N/A';
            if(row.description === '') row.description = 'N/A';
            if(row.projectStatus === 0) {
                row.projectStatus = 'Projecessing';
            } else if(row.projectStatus === 1) {
                row.projectStatus = 'Success';
            } else if(row.projectStatus === 2) {
                row.projectStatus = 'Failed';
            } else if(row.projectStatus === 3) {
                row.projectStatus = 'Removed';
            }
            if(row.envStatus === 1) {
                row.envStatus = 'Yes';
            } else {
                row.envStatus = 'No';
            }
            if(row.seqStatus === 1) {
                row.seqStatus = 'Yes';
            } else {
                row.seqStatus = 'No';
            }
            row.projectLink = '/data?id=' + row.projectCode;
        });
        res.render('pages/home', {
            projects: rows
        });
    });
});

app.use(express.static(__dirname + '/public'));

app.get('/submit', function (req, res) {
    res.sendFile( __dirname + "/public/" + "submit.html" );
});
app.get('/logout',(req, res)=> {
    req.logout();
    //req.session.destroy();
    req.session = null;
    res.redirect('/');
});
app.post('/upload', function (req, res) {
    console.log("hello,upload");
    let uid = req.session.passport.user.profile.id;
    var form = new formidable.IncomingForm();
    form.maxFileSize = 5000 * 1024 * 1024; // 5gb file size limit
    form.encoding = 'utf-8';
    form.uploadDir = "tmp";
    form.keepExtensions = true;
    form.parse(req, function (err, fields, files) {
        //console.log(fields.projectname);
        //console.log(fields.emailaddress);
        //console.log(files.dbfile);
        var projectname = fields.projectname;
        var emailtosend = fields.emailaddress;
        var description = fields.description;
        var public = fields.public;
        var file = files.dbfile;
        if (file === undefined) {
            console.log("Upload files failed!");
            return;
        }
        var fname = file.name; // hello.txt
        var envFile1 = files.envfile1;
        // var envFile2 = files.envfile2;
        var folderid = uuidv1();
        var des_path = "data/" + folderid + "/";
        var des_file = "data/" + folderid + "/" + fname;
        // var des_envFile1 = "data/" + folderid + "/" + "ms1.env";
        var des_envFile2 = "data/" + folderid + "/" + "ms2.env";
        //console.log(envFile1);
        // Generate new path for file
        if (!fs.existsSync(des_path)) {
            console.log('The path does not exist.');
            fs.mkdirSync(des_path);
            console.log('Path created: ',des_path);
        }
        if(envFile1 !== undefined) {
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
                    var adr =  'https://toppic.soic.iupui.edu/data?id=';
                    // output result into screen

                    res.write('<h1>File uploaded successfully!</h1>');
                    res.write('<h2>Project Name: </h2>');
                    res.write(projectname);
                    res.write('<h2>File Path: </h2>');
                    res.write(des_file);

                    var id = makeid(11);

                    ifExists(db, id, function (err, result) {
                        if(err) {
                            console.log(err);
                        }
                        while (true) {
                            // console.log(result);
                            if(!result) {
                                insertRow(db, id, projectname, fname, description,des_file,0, emailtosend,1,0,envFile1.name,uid,public);
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

                                res.write('<h2>Link: </h2>');
                                res.write(message.text);

                                res.end();
                                break;
                            }
                        }
                    });

                    response = {
                        message:'File uploaded successfully',
                        filename:fname,
                        projectname:projectname,
                        link:message.text,
                        email: emailtosend
                    };
                    //console.log(response);
                    res.write(JSON.stringify( response ));

                    execFile(__dirname + "/cpp/bin/mzMLReader", [des_file,'-f'], (err, stdout, stderr) => {
                        if(err) {
                            setTimeout(function () {
                                processFailure(db,id, function (err) {
                                    console.log("Process failed!");
                                    message.text = "Project Name: " + projectname + "\nFile Name: " + fname + '\nProject Status: Cannot process your dataset, please check your data.';
                                    message.subject = "Your data processing failed";
                                    message.to = emailtosend;
                                    transport.sendMail(message, function(err, info) {
                                        if (err) {
                                            console.log(err)
                                        } else {
                                            console.log(info);
                                        }
                                    });
                                });
                                console.log(err);
                                return;
                            }, 60000);
                        }
                        //console.log(`stdout: ${stdout}`);
                        let dbDir = des_file.substr(0, des_file.lastIndexOf(".")) + ".db";
                        execFile('node',[__dirname + '/convertEnv.js',dbDir,des_envFile1],((err, stdout, stderr) => {
                            if(err) {
                                setTimeout(function () {
                                    processFailure(db,id, function (err) {
                                        console.log("Process failed!");
                                        message.text = "Project Name: " + projectname + "\nFile Name: " + fname + '\nProject Status: Cannot process your dataset, please check your data.';
                                        message.subject = "Your data processing failed";
                                        message.to = emailtosend;
                                        transport.sendMail(message, function(err, info) {
                                            if (err) {
                                                console.log(err)
                                            } else {
                                                console.log(info);
                                            }
                                        });
                                    });
                                    console.log(err);
                                    return;
                                }, 60000);
                            }
                            //console.log(`stdout: ${stdout}`);
                            //console.log(data.toString());
                            else {
                                updateProjectStatus(db,1, id, function (err) {
                                    message.text = "Project Name: " + projectname + "\nFile Name: " + fname + "\nLink: " + adr + id + '\nStatus: Done';
                                    message.subject = "Your data processing is done";
                                    message.to = emailtosend;
                                    transport.sendMail(message, function(err, info) {
                                        if (err) {
                                            console.log(err)
                                        } else {
                                            console.log(info);
                                        }
                                    });
                                });

                            }
                        }));
                    });
                });
            })
        } else {
            fs.rename(file.path, des_file, function (err) {
                if(err) {
                    console.log(err);
                    return res.send({"error": 403, "message": "Error on saving file!"});
                }
                var adr =  'https://toppic.soic.iupui.edu/data?id=';
                // output result into screen

                res.write('<h1>File uploaded successfully!</h1>');
                res.write('<h2>Project Name: </h2>');
                res.write(projectname);
                res.write('<h2>File Path: </h2>');
                res.write(des_file);

                var id = makeid(11);

                ifExists(db, id, function (err, result) {
                    if(err) {
                        console.log(err);
                    }
                    while (true) {
                        // console.log(result);
                        if(!result) {
                            insertRow(db, id, projectname, fname,description,des_file,0, emailtosend,0,0,0,uid,public);
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

                            res.write('<h2>Link: </h2>');
                            res.write(message.text);

                            res.end();
                            break;
                        }
                    }
                });

                response = {
                    message:'File uploaded successfully',
                    filename:fname,
                    projectname:projectname,
                    link:message.text,
                    email: emailtosend
                };

                //console.log(response);
                res.write(JSON.stringify( response ));

                execFile(__dirname + "/cpp/bin/mzMLReader", [des_file,'-f'], (err, stdout, stderr) => {
                    if(err) {
                        setTimeout(function () {
                            processFailure(db,id, function (err) {
                                console.log("Process failed!");
                                message.text = "Project Name: " + projectname + "\nFile Name: " + fname + '\nProject Status: Cannot process your dataset, please check your data.';
                                message.subject = "Your data processing failed";
                                message.to = emailtosend;
                                transport.sendMail(message, function(err, info) {
                                    if (err) {
                                        console.log(err)
                                    } else {
                                        console.log(info);
                                    }
                                });
                            });
                            console.log(err);
                            return;
                        }, 60000);
                    }else{
                        updateProjectStatus(db,1, id, function (err) {
                            message.text = "Project Name: " + projectname + "\nFile Name: " + fname + "\nLink: " + adr + id + '\nStatus: Done';
                            message.subject = "Your data processing is done";
                            message.to = emailtosend;
                            transport.sendMail(message, function(err, info) {
                                if (err) {
                                    console.log(err)
                                } else {
                                    console.log(info);
                                }
                            });
                        });
                    }
                });
            });
        }
    })
});

app.get('/data', function(req, res) {
    console.log("Hello data!");
    var projectCode = req.query.id;
    let uid = 0;
    if (req.session.passport === undefined)
    {
        //console.log('No user auth!');
    }
    else {
        //console.log(req.session.passport.user.profile);
        uid = req.session.passport.user.profile.id;
        /*console.log(typeof uid);
        console.log('uid', uid);*/
    }


    getProjectSummary(db, projectCode, function (err, row) {
        let summary;
        if (err) {
            console.log(err);
        } else {
            // console.log(row.projectStatus);
            if(row === undefined) {
                res.send("No such project, please check your link.");
                res.end();
            } else {
                // console.log(row);
                if (row.projectStatus === 1) {
                    summary = {
                        ProjectName: row.projectName,
                        ProjectStatus: row.projectStatus,
                        EmailAddress: row.email,
                        MS1_envelope_file: row.ms1_envelope_file,
                        envStatus: row.envelopeStatus
                    };
                    //console.log(summary);
                    let projectDir = row.projectDir;
                    let projectUid = row.uid;
                    var fileName = row.fileName;
                    //console.log(projectUid);
                    //res.write(JSON.stringify(summary));
                    //console.log(row.projectDir);
                    if(uid === projectUid) {
                        getScanRange(projectDir, function (err, row) {
                            let scanRange = {
                                MIN: row.minScan,
                                MAX: row.maxScan
                            };
                            //res.write(JSON.stringify(scanRange));
                            //console.log(projectDir);
                            res.render('pages/result', {
                                summary,
                                scanRange,
                                projectCode,
                                projectDir,
                                fileName
                            });
                        })
                    } else {
                        getScanRange(projectDir, function (err, row) {
                            let scanRange = {
                                MIN: row.minScan,
                                MAX: row.maxScan
                            };
                            //res.write(JSON.stringify(scanRange));
                            //console.log(projectDir);
                            res.render('pages/guestResult', {
                                summary,
                                scanRange,
                                projectCode,
                                projectDir,
                                fileName
                            });
                        });
                        /*res.send('You are not the owner of this project');
                        res.end();*/
                    }
                } else if (row.projectStatus === 0) {
                    console.log("Project status: 0");
                    res.send("Your project is processing, please wait for result.");
                    res.end();
                } else if (row.projectStatus === 2) {
                    console.log("Project status: 2");
                    res.send("Your project failed. Please check your data.");
                    res.end();
                } else if (row.projectStatus === 3) {
                    console.log("Project status: 3");
                    res.send("Your project has been removed, because it has been one month since you uploaded it.");
                    res.end();
                }
            }
        }
    });
});
app.post('/sequence', function (req,res) {
    console.log('Hello, sequence!');
    var form = new formidable.IncomingForm();
    form.maxFileSize = 5000 * 1024 * 1024; // 5gb file size limit
    form.encoding = 'utf-8';
    form.uploadDir = "tmp";
    form.keepExtensions = true;
    form.parse(req, function (err, fields, files) {
        var seqFile = files.seqFile;
        var email = fields.email;
        var projectDir = fields.projectDir;
        var projectName = fields.projectName;
        var projectCode = fields.projectCode;
        var dbDir = projectDir.substr(0, projectDir.lastIndexOf(".")) + '.db';
        var des_seq = projectDir.substr(0, projectDir.lastIndexOf("/")) + '/' + seqFile.name;
        if (seqFile === undefined) {
            console.log("Upload files failed!");
            sendFailureMess(db, projectName, projectCode, email);
            return;
        }
        fs.rename(seqFile.path, des_seq, function (err) {
            if (err) {
                console.log(err);
                return res.send({"error": 403, "message": "Error on saving file!"});
            }
            deleteSeq(projectDir, projectCode, function () {
                updateSeqStatus(db, 0, projectCode, function () {
                    updateProjectStatus(db, 0, projectCode, function () {
                        res.end();
                        execFile('node',[__dirname + '/sequenceParse.js',dbDir,des_seq],((err, stdout, stderr) => {
                            if(err) {
                                console.log('Processing sequence file failed!');
                                sendFailureMess(db, projectName, projectCode, email);
                                return;
                            }
                            updateSeqStatus(db,1, projectCode, function () {
                                updateProjectStatus(db, 1, projectCode, function () {
                                    console.log('Sequence process is done!');
                                });
                            });
                        }))
                    })
                });
            })
        })
    })
});
app.get('/seqQuery', function (req, res) {
    let projectDir = req.query.projectDir;
    let projectCode = req.query.projectCode;
    let scanNum = req.query.scanID;
    getProjectSummary(db,projectCode,function (err,row) {
        let seqStatus = row.sequenceStatus;
        if(seqStatus === 1) {
            let proteoform = getProteoform(projectDir, scanNum);
            //console.log(proteoform);
            if (proteoform !== 0) {
                res.write(proteoform);
                res.end();
            } else {
                res.write('0');
                res.end();
            }
        } else {
            res.write('0');
            res.end();
        }
    });
});
app.post('/msalign', function (req, res) {
    var form = new formidable.IncomingForm();
    form.maxFileSize = 5000 * 1024 * 1024; // 5gb file size limit
    form.encoding = 'utf-8';
    form.uploadDir = "tmp";
    form.keepExtensions = true;
    form.parse(req, function (err, fields, files) {
        var ms1 = files.ms1file;
        var ms2 = files.ms2file;
        var dbDir = fields.projectDir;
        var projectName = fields.projectName;
        var projectCode = fields.projectCode;
        deleteEnvPeak(dbDir, projectCode, function () {
            console.log('Deleted previous Envelope Peaks!');
            var email = fields.email;
            dbDir = dbDir.substr(0, dbDir.lastIndexOf(".")) + '.db';
            var des_ms1 = dbDir.substr(0, dbDir.lastIndexOf("/")) + '/' + ms1.name;
            var des_ms2 = dbDir.substr(0, dbDir.lastIndexOf("/")) + '/' + ms2.name;
            if (ms1 === undefined || ms2 === undefined) {
                console.log("Upload files failed!");
                sendFailureMess(db, projectName, projectCode, email);
                return;
            }
            fs.rename(ms1.path, des_ms1, function (err) {
                if (err) {
                    console.log(err);
                    return res.send({"error": 403, "message": "Error on saving file!"});
                }
                fs.rename(ms2.path, des_ms2, function (err) {
                    if (err) {
                        console.log(err);
                        return res.send({"error": 403, "message": "Error on saving file!"});
                    }
                    updateProjectStatus(db,0, fields.projectCode, function () {
                        res.end();
                        execFile('node',[__dirname + '/convertMS1Msalign.js',dbDir,des_ms1],((err, stdout, stderr) => {
                            if(err) {
                                sendFailureMess(db, projectName, projectCode, email);
                            }
                            execFile('node',[__dirname + '/convertMS2Msalign.js',dbDir,des_ms2],((err, stdout, stderr) => {
                                if(err) {
                                    sendFailureMess(db, projectName, projectCode, email);
                                } else {
                                    sendSuccessMess(db, projectName, projectCode, email);
                                    console.log('msalign file processing is done!');
                                }
                            }));
                        }));
                    });
                })
            })
        });
    })
});
app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/' }),
    function(req, res) {
        //console.log('req.user.token',req.user.profile);
        let profile = req.user.profile;
        req.session.token = req.user.token;
        insertUser(db, profile.id, profile.emails[0].value,profile.name.givenName, profile.name.familyName, profile.displayName);
        res.redirect('/');
    });
app.get('/seqResults', function (req,res) {
    console.log('Hello, seqResults');
    let projectCode = req.query.projectCode;
    getProjectSummary(db, projectCode, function (err,row) {
        if(row===undefined) {
            res.sendStatus(404);
            return;
        }
        let projectDir = row.projectDir;
        let envStatus = row.envelopeStatus;
        let seqStatus = row.sequenceStatus;
        if (seqStatus === 1 && envStatus === 1){
            let results = getAllSeq(projectDir);
            res.render('pages/sequence', {
                projectDir: projectDir,
                projectCode: projectCode,
                results: results
            });
        } else if(seqStatus === 1 && envStatus === 0) {
            let results = getAllSeq(projectDir);
            res.render('pages/seqWithoutEnv', {
                projectDir: projectDir,
                projectCode: projectCode,
                results: results
            });
        } else {
            res.write("You haven't uploaded sequence data, please upload first to check your sequence result!");
            res.end();
        }
    })
});
app.get('/projects', function (req,res) {
    //console.log('Cookies: ', req.cookies);
    //console.log('Session:', req.session);
    //console.log(req.session.passport.user.profile);
    //console.log(req.session);
    //let uid = req.session.passport.user.profile.uid;
    if (req.session.passport === undefined)
        res.render('pages/projects', {
            projects: []
        });
    else {
        //console.log(req.session.passport.user.profile);
        let uid = req.session.passport.user.profile.id;
        //console.log(uid);
        getProjects(db,uid,function (rows) {
            rows.forEach(row=>{
                if(row.envelopeFile === '0') row.envelopeFile = 'N/A';
                if(row.description === '') row.description = 'N/A';
                if(row.projectStatus === 0) {
                    row.projectStatus = 'Processing';
                } else if(row.projectStatus === 1) {
                    row.projectStatus = 'Success';
                } else if(row.projectStatus === 2) {
                    row.projectStatus = 'Failed';
                } else if(row.projectStatus === 3) {
                    row.projectStatus = 'Removed';
                }
                if(row.envStatus === 1) {
                    row.envStatus = 'Yes';
                } else {
                    row.envStatus = 'No';
                }
                if(row.seqStatus === 1) {
                    row.seqStatus = 'Yes';
                } else {
                    row.seqStatus = 'No';
                }
                row.projectLink = '/data?id=' + row.projectCode;
            });
            res.render('pages/projects', {
                projects: rows
            });
        });
    }

});
app.get('/deleteMsalign', function (req,res) {
    let projectDir = req.query.projectDir;
    let projectCode = req.query.projectCode;
    deleteEnvPeak(projectDir, projectCode, function () {
        res.end();
    });
});
app.get('/deleteSeq', function (req,res) {
    let projectDir = req.query.projectDir;
    let projectCode = req.query.projectCode;
    deleteSeq(projectDir, projectCode, function () {
        updateSeqStatus(db,0, projectCode, function () {
            res.end();
        });
    });
});
app.get('/download', function (req,res) {
    let projectCode = req.query.id;
    getProjectSummary(db, projectCode, function (err,row) {
        let projectDir = row.projectDir;
        res.download(projectDir);
    })

});
app.get('/deleterow', function (req,res) {
    console.log("Hello, deleterow!");
    let projectDir = req.query.projectDir;
    let envelopeIDs = req.query.envList;
    deleteMultiEnvs(projectDir,envelopeIDs,function () {
        res.end();
    });
});
app.get('/addrow', function (req,res) {
    console.log("Hello, addrow!");
    let projectDir = req.query.projectDir;
    //let envID = req.query.envelope_id;
    let scan_id = req.query.scan_id;
    let charge = req.query.charge;
    let monoMass = req.query.mono_mass;
    let theoInteSum = req.query.intensity;
    getEnvMax(projectDir,function (envID) {
        //console.log(envID);
        ++envID;
        addEnv(projectDir,envID,scan_id,charge,monoMass,theoInteSum,function () {
            addEnvPeak(projectDir,charge,monoMass,scan_id,envID,function () {
                getEnv(projectDir,envID,function (row) {
                    res.json(row);
                    res.end();
                });
            });
        });
    })
});
app.get('/editrow', function (req,res) {
    console.log("Hello, editrow!");
    let projectDir = req.query.projectDir;
    let scan_id = req.query.scan_id;
    let envID = req.query.envelope_id;
    let charge = req.query.charge;
    let monoMass = req.query.mono_mass;
    let theoInteSum = req.query.intensity;

    editEnv(projectDir,envID,charge,monoMass,theoInteSum,function () {
        addEnvPeak(projectDir,charge,monoMass,scan_id,envID,function () {
            getEnv(projectDir,envID,function (row) {
                res.json(row);
                res.end();
            });
        });
    })
});
app.get('/peaklist', function(req, res) {
    console.log("Hello, peaklist!");
    //var projectCode = req.query.projectCode;
    var projectDir = req.query.projectDir;
    var scanID = req.query.scanID;
    getPeakList(projectDir, scanID, function (err, rows) {
        //console.log('test', calcDistrubution.emass(2654,2,rows));
        res.write(JSON.stringify(rows));
        res.end();
    })
});
app.get('/scanID', function (req, res) {
    console.log("Hello, scanID!");
    var projectDir = req.query.projectDir;
    var id = req.query.ID;
    getScanID(projectDir, id, function (err, row) {
        let scanID = row.scanID.toString();
        res.write(scanID);
        res.end();
    })
});
app.get('/prev', function(req, res) {
    console.log("Hello, prev!");
    var projectDir = req.query.projectDir;
    var scanID = req.query.scanID;
    getPrev(projectDir, scanID, function (err, row) {
        let prevID = row.prev.toString();
        res.write(prevID);
        res.end();
    })
});
app.get('/next', function(req, res) {
    console.log("Hello, next!");
    var projectDir = req.query.projectDir;
    var scanID = req.query.scanID;
    getNext(projectDir, scanID, function (err, row) {
        let nextID = row.next.toString();
        res.write(nextID);
        res.end();
    })
});
app.get('/scanlevel', function (req, res) {
    console.log("Hello, scanlevel!");
    var projectDir = req.query.projectDir;
    var scanID = req.query.scanID;
    getScanLevel(projectDir, scanID, function (err, row) {
        let scanLevel = row.scanLevel.toString();
        res.write(scanLevel);
        res.end();
    })
});
app.get('/relatedScan1', function (req, res) {
    console.log("Hello, relatedScan1!");
    var projectDir = req.query.projectDir;
    var scanID = req.query.scanID;
    getRelatedScan1(projectDir, scanID, function (err, row) {
        if(row !== undefined) {
            let levelTwoScanID = row.LevelTwoScanID.toString();
            res.write(levelTwoScanID);
            res.end();
        }else {
            res.write("0");
            res.end();
        }
    })
});
app.get('/relatedScan2', function (req, res) {
    console.log("Hello, relatedScan2!");
    var projectDir = req.query.projectDir;
    var scanID = req.query.scanID;
    getRelatedScan2(projectDir, scanID, function (err, row) {
        let levelOneScanID = row.LevelOneScanID.toString();
        res.write(levelOneScanID);
        res.end();
    })
});
app.get('/precMZ', function (req, res) {
    console.log("Hello, precMZ!");
    var projectDir = req.query.projectDir;
    var scanID = req.query.scanID;
    getPrecMZ(projectDir, scanID, function (err, row) {
        let precMZ = row.precMZ.toString();
        res.write(precMZ);
        res.end();
    })
});
app.get('/scanTwoList', function (req, res) {
    console.log("Hello, scanTwoList!");
    var projectDir = req.query.projectDir;
    var scanID = req.query.scanID;
    getScanLevelTwoList(projectDir, scanID, function (err, rows) {
        res.write(JSON.stringify(rows));
        // console.log(rows);
        res.end();
    })
});
app.get('/getInteSumList', function (req, res) {
    console.log("Hello, getInteSumList!");
    var projectDir = req.query.projectDir;
    getSumList(projectDir, function (err, rows) {
        res.write(JSON.stringify(rows));
        // console.log(rows);
        res.end();
    })
});
app.get('/getRT', function (req, res) {
    console.log("Hello, getRT!");
    var projectDir = req.query.projectDir;
    var scanNum = req.query.scanID;
    getRT(projectDir, scanNum, function (err, row) {
        res.write(row.rt.toString());
        res.end();
    })
});

app.get('/findNextLevelOneScan', function (req, res) {
    console.log("Hello, findNextLevelOneScan!");
    var projectDir = req.query.projectDir;
    var scan = req.query.scanID;
    getNextLevelOneScan(projectDir, scan, function (err, row) {
        if (row !== undefined) {
            res.write(row.scan.toString());
            res.end();
        }else {
            res.write("0");
            res.end();
        }
    });
});
app.get('/envlist', function(req, res) {
    console.log("Hello, envlist!");
    let projectDir = req.query.projectDir;
    let scanid = req.query.scanID;
    let projectCode = req.query.projectCode;
    //console.log(scanid);
    let dbDir = projectDir.substr(0, projectDir.lastIndexOf(".")) + ".db";
    let resultDb = new sqlite3.Database(dbDir, (err) => {
        if (err) {
            console.error(err.message);
        }
        // console.log('Connected to the result database.');
    });
    ifEnvExists(db, projectCode,(err, row)=> {
        if(row.EnvelopeStatus === 1) {
            showData(resultDb,scanid,res);
        }else {
            res.write('0');
            res.end();
        }
    })
});
app.get('/envtable', function (req, res) {
    console.log("Hello, envtable!");
    let projectDir = req.query.projectDir;
    let scanNum = req.query.scanID;
    /*getScanID(projectDir,scanNum,function (err, row) {
        let scanID;
        if(row !== undefined) {
            scanID = row.scanID;
        }

    })*/
    getEnvTable(projectDir, scanNum, function (err, rows) {
        //console.log("Env Table rows:", rows);
        if (rows !== undefined) {
            //console.log(scanNum);
            //console.log(rows);
            res.json(rows);
            //res.write(JSON.stringify(rows));
            res.end();
        }else {
            res.write("0");
            res.end();
        }
    });
});
app.get('/auth/google', passport.authenticate('google', {
    scope: ['https://www.googleapis.com/auth/userinfo.profile','https://www.googleapis.com/auth/userinfo.email']
}));

app.use('/*', function(req, res){
    console.log('404 handler..');
    //console.log(req);
    res.sendFile( __dirname + "/public/" + "404.html" );
});

var server = app.listen(8443, function () {
    // var host = server.address().address;
    var port = server.address().port;
    console.log("Started on PORT %s", port)
});

function makeid(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}
function updateProjectStatus(db, status,id,callback) {
    let sql = `UPDATE Projects
                SET ProjectStatus = ?
                WHERE ProjectCode = ?`;
    db.run(sql, [status,id], function (err) {
        if (err) {
            return console.error(err.message);
        }
        console.log(`Row(s) updated: ${this.changes}`);
        return callback(null);
    });
}
function updateEnvStatus(db,status,id,callback) {
    let sql = `UPDATE Projects
                SET EnvelopeStatus = ?
                WHERE ProjectCode = ?`;
    db.run(sql, [status,id], function (err) {
        if (err) {
            return console.error(err.message);
        }
        console.log(`Row(s) updated: ${this.changes}`);
        return callback(null);
    });
}
function updateSeqStatus(db,status,id,callback) {
    let sql = `UPDATE Projects
                SET SequenceStatus = ?
                WHERE ProjectCode = ?`;
    db.run(sql, [status,id], function (err) {
        if (err) {
            return console.error(err.message);
        }
        console.log(`Row(s) updated: ${this.changes}`);
        return callback();
    });
}
function sendFailureMess(db, projectName,projectCode,email) {
    setTimeout(function () {
        processFailure(db,projectCode, function (err) {
            console.log("Process failed!");
            message.text = "Project Name: " + projectName + '\nProject Status: Cannot process your dataset, please check your data.';
            message.subject = "Your data processing failed";
            message.to = email;
            transport.sendMail(message, function(err, info) {
                if (err) {
                    console.log(err)
                } else {
                    console.log(info);
                }
            });
        });
    }, 60000);
}
function sendSuccessMess(db, projectName,projectCode,email) {
    updateProjectStatus(db,1, projectCode, function (err) {
        updateEnvStatus(db, 1, projectCode, function (err) {
            message.text = "Project Name: " + projectName + '\nStatus: Done' + '\nPlease go to project center to check your result.';
            message.subject = "Your data processing is done";
            message.to = email;
            transport.sendMail(message, function(err, info) {
                if (err) {
                    console.log(err)
                } else {
                    console.log(info);
                }
            });
        });
    });
}
function processFailure(db, id, callback) {
    let sql = `UPDATE Projects
                SET ProjectStatus = 2
                WHERE ProjectCode = ?`;
    db.run(sql, [id], function (err) {
        if (err) {
            return console.error(err.message);
        }
        console.log(`Row(s) updated: ${this.changes}`);
        return callback(null);
    });
}
function getFilePath(db, id, callback) {
    let sql = `SELECT ProjectDir AS dir
             FROM Projects
             WHERE ProjectCode  = ?`;

    db.get(sql, [id], (err, row) => {
            if (err) {
                return callback(err);
            }
            else {
                 return callback(null, row.dir);
            }
    });
}
function getProjectSummary(db, id, callback) {
    let sql = `SELECT ProjectName AS projectName,
                    ProjectStatus AS projectStatus,
                    Email AS email,
                    ProjectDir AS projectDir,
                    FileName AS fileName,
                    EnvelopeStatus AS envelopeStatus,
                    SequenceStatus AS sequenceStatus,
                    MS1_envelope_file AS ms1_envelope_file,
                    uid AS uid
                FROM Projects
                WHERE ProjectCode = ?`;
    db.get(sql, [id], (err, row) => {
        if (err) {
            return callback(err);
        }
        else {
            //console.log(row);
            return callback(null, row);
        }
    });
}
function getEnvNum(resultDB, scanid,callback) {
    let sql = `SELECT envelope_id AS id,mono_mass AS mono_mass, charge AS charge
                FROM envelope
                WHERE scan_id = ?`;
    resultDB.all(sql, [scanid], (err, rows) => {
        if(err) {
            throw err;
        }
        return callback(null, rows);
    });
}
function getEnvPeakList(resultDB, envelope_id, callback) {
    let sql = `SELECT mz, intensity
                FROM env_peak
                WHERE envelope_id = ?`;
    resultDB.all(sql, [envelope_id], (err, rows) => {
        if (err) {
            throw err;
        }
        return callback(null,rows);
    });
    //db.close();
}
function getEnvCharge(resultDB, envelope_id, callback) {
    let sql = `SELECT mono_mass AS mono_mass, charge AS charge
                FROM envelope
                WHERE envelope_id = ?`;
    resultDB.get(sql, [envelope_id], (err, row) => {
        if(err) {
            throw err;
        }
        return callback(null, row);
    });
    //db.close();
}
let times = 0;
let result=[];
function showData(resultDB,scan_id,res) {
    getEnvNum(resultDB, scan_id, function (err, rows) {
        //console.log(rows.length);
        //console.log(typeof rows);
        let max = rows.length;
        if (rows.length === 0){
            //console.log("Empty rows!");
            res.write("0");
            res.end();
            resultDB.close();
        }
        else {
            rows.forEach(envelope => {
                let id = envelope.id;
                let charge = envelope.charge;
                let mono_mass = envelope.mono_mass;
                let oneEnvelope = {};
                oneEnvelope.mono_mass = mono_mass;
                oneEnvelope.charge = charge;
                getEnvPeakList(resultDB,id, function(err, rows) {
                    oneEnvelope.env_peaks=rows;
                    result.push(oneEnvelope);
                    ++times;
                    if(times === max){
                        //console.log(JSON.stringify(result));
                        res.write(JSON.stringify(result));
                        res.end();
                        times = 0;
                        result = [];
                        resultDB.close();
                    }
                });
            });
        }
    });
}
function deleteEnv(dir, envID, callback) {
    let sql = `DELETE FROM envelope
                WHERE envelope_id = ?`;
    let dbDir = dir.substr(0, dir.lastIndexOf(".")) + ".db";
    let resultDb = new sqlite3.Database(dbDir, (err) => {
        if (err) {
            console.error(err.message);
        }
        // console.log('Connected to the result database.');
    });
    resultDb.run(sql,[envID], function(err) {
        if (err) {
            return console.error(err.message);
        }
        console.log(`Row(s) deleted: ${this.changes}`);
        return callback();
    });
    resultDb.close();
}
function deleteEnvPeak(projectDir, projectCode, callback) {
    let dbDir = projectDir.substr(0, projectDir.lastIndexOf(".")) + ".db";
    let resultDb = new BetterDB(dbDir);

    let stmt = resultDb.prepare(`DROP TABLE IF EXISTS env_peak;`);
    stmt.run();
    stmt = resultDb.prepare(`DROP TABLE IF EXISTS envelope;`);
    stmt.run();
    resultDb.close();
    updateEnvStatus(db,0,projectCode, function () {
        callback();
    });
}
function deleteSeq(projectDir, projectCode, callback) {
    let dbDir = projectDir.substr(0, projectDir.lastIndexOf(".")) + ".db";
    let resultDb = new BetterDB(dbDir);

    let stmt = resultDb.prepare(`DROP TABLE IF EXISTS sequence;`);
    stmt.run();
    resultDb.close();
    callback();
}
function editEnv(dir, envID, charge, monoMass, theoInteSum, callback) {
    let sql = `UPDATE envelope
                SET charge = ?,
                mono_mass = ?,
                intensity = ?
                WHERE envelope_id = ?;`;
    let sqlDelete = `DELETE FROM env_peak WHERE envelope_id = ?`;
    let dbDir = dir.substr(0, dir.lastIndexOf(".")) + ".db";
    let resultDb = new sqlite3.Database(dbDir, (err) => {
        if (err) {
            console.error(err.message);
        }
        // console.log('Connected to the result database.');
    });
    resultDb.run(sql,[charge, monoMass,theoInteSum,envID], function(err) {
        if (err) {
            return console.error(err.message);
        }
        resultDb.run(sqlDelete,[envID], function (err) {
            //console.log(this);
            console.log(`Row(s) edited: ${this.changes}`);
            return callback();
        });
    });
    resultDb.close();
}
function addEnv(dir, envID, scan, charge, monoMass,theoInteSum,callback) {
    let sql = `INSERT INTO envelope(envelope_id, scan_id, charge, mono_mass,intensity)
                VALUES(?,?,?,?,?);`;
    let dbDir = dir.substr(0, dir.lastIndexOf(".")) + ".db";
    let resultDb = new sqlite3.Database(dbDir, (err) => {
        if (err) {
            console.error(err.message);
        }
        // console.log('Connected to the result database.');
    });
    resultDb.run(sql,[envID,scan,charge,monoMass,theoInteSum], function(err) {
        if (err) {
            return console.error(err.message);
        }
        //console.log(this);
        console.log(`Row(s) added: ${this.changes}`);
        return callback();
    });
    resultDb.close();
}
function addEnvPeak(dir, charge, theo_mono_mass, scan_id, envelope_id, callback) {
    getPeakListByScanID(dir,scan_id,function (rows) {
        let peakList = calcDistrubution.emass(theo_mono_mass,charge,rows);
        //console.log(peakList);
        getEnvPeakMax(dir,function (maxID) {
            let envPeakID = maxID + 1;

            let dbDir = dir.substr(0, dir.lastIndexOf(".")) + ".db";
            let resultDb = new BetterDB(dbDir);

            let stmt = resultDb.prepare(`INSERT INTO env_peak(env_peak_id, envelope_id, mz, intensity)
                VALUES(?,?,?,?)`);
            let insertMany = resultDb.transaction((peakList,envPeakID) => {
                peakList.forEach(peak => {
                    stmt.run(envPeakID,envelope_id,peak.mz,peak.intensity);
                    envPeakID++;
                })
            });
            insertMany(peakList,envPeakID);
            resultDb.close();
            return callback();
        })
    })
}
function deleteSingleEnv(dir, envID, callback) {
    let dbDir = dir.substr(0, dir.lastIndexOf(".")) + ".db";
    let resultDb = new BetterDB(dbDir);

    let stmt = resultDb.prepare(`DELETE FROM envelope WHERE envelope_id = ?`);
    stmt.run(envID);
    resultDb.close();
    return callback();
}
function deleteMultiEnvs(dir, envList,callback) {
    let dbDir = dir.substr(0, dir.lastIndexOf(".")) + ".db";
    let resultDb = new BetterDB(dbDir);

    let stmt = resultDb.prepare(`DELETE FROM envelope WHERE envelope_id = ?`);
    let deleteMany = resultDb.transaction((envList) => {
        envList.forEach(env => {
            stmt.run(env.envelope_id);
        })
    });
    deleteMany(envList);
    resultDb.close();
    return callback();
}
function insertEnvPeak(dir, envPeakID, envID, mz, intensity) {
    let dbDir = dir.substr(0, dir.lastIndexOf(".")) + ".db";
    let resultDb = new betterDB(dbDir);

    let stmt = resultDb.prepare(`INSERT INTO env_peak(env_peak_id, envelope_id, mz, intensity)
                VALUES(?,?,?,?)`);
    const insertMany = db.transaction((cats) => {
        for (const cat of cats) stmt.run(envPeakID,envelope_id,peak.mz,peak.intensity);
    });
    resultDb.run(sql,[envPeakID,envID,mz,intensity], function(err) {
        if (err) {
            return console.error(err.message);
        }
        //console.log(this);
        console.log(`Row(s) added: ${this.changes}`);
    });
    resultDb.close();
}
function getPeakListByScanID(dir,scan_id,callback) {
    let sql = `SELECT MZ AS mz,
                INTENSITY AS intensity
                FROM PEAKS
                WHERE SPECTRAID = ?;`;
    let dbDir = dir.substr(0, dir.lastIndexOf(".")) + ".db";
    let resultDb = new sqlite3.Database(dbDir, (err) => {
        if (err) {
            console.error(err.message);
        }
        //console.log('Connected to the result database.' + dbDir);
    });
    resultDb.all(sql, [scan_id], (err, rows) => {
        if (err) {
            throw err;
        }
        return callback(rows);
    });
    resultDb.close();
}
function getEnvPeakMax(dir,callback) {
    let sql = `SELECT MAX(env_peak_id) AS maxID
                FROM env_peak`;
    let dbDir = dir.substr(0, dir.lastIndexOf(".")) + ".db";
    let resultDb = new sqlite3.Database(dbDir, (err) => {
        if (err) {
            console.error(err.message);
        }
        // console.log('Connected to the result database.');
    });
    resultDb.get(sql,(err,row) => {
        if (err) {
            return console.error(err.message);
        }
        //console.log(this);
        // console.log(`Row(s) edited: ${this.changes}`);
        return callback(row.maxID);
    });
    resultDb.close();
}
function getEnvMax(dir, callback){
    let sql = `SELECT MAX(envelope_id) AS maxID
                FROM envelope`;
    let dbDir = dir.substr(0, dir.lastIndexOf(".")) + ".db";
    let resultDb = new sqlite3.Database(dbDir, (err) => {
        if (err) {
            console.error(err.message);
        }
        // console.log('Connected to the result database.');
    });
    resultDb.get(sql,(err,row) => {
        if (err) {
            return console.error(err.message);
        }
        //console.log(this);
        // console.log(`Row(s) edited: ${this.changes}`);
        return callback(row.maxID);
    });
    resultDb.close();
}

function getEnv(dir, envID,callback) {
    let sql = `SELECT *
                FROM envelope
                WHERE envelope_id = ?;`;
    let dbDir = dir.substr(0, dir.lastIndexOf(".")) + ".db";
    let resultDb = new sqlite3.Database(dbDir, (err) => {
        if (err) {
            console.error(err.message);
        }
        // console.log('Connected to the result database.');
    });
    resultDb.get(sql,envID, (err,row) => {
        if (err) {
            return console.error(err.message);
        }
        return callback(row);
    });
    resultDb.close();
}
function getRT(dir, scanNum, callback) {
    let sql = `SELECT RETENTIONTIME AS rt
                FROM SPECTRA
                WHERE SCAN = ?`;
    let dbDir = dir.substr(0, dir.lastIndexOf(".")) + ".db";
    let resultDb = new sqlite3.Database(dbDir, (err) => {
        if (err) {
            console.error(err.message);
        }
        // console.log('Connected to the result database.');
    });
    resultDb.get(sql,[scanNum], (err, row) => {
        if (err) {
            console.error(err.message);
        }
        //console.log(row);
        return callback(null, row);
    });
    resultDb.close();
}
function getEnvTable(dir, scanID, callback){
    let sql = `SELECT envelope_id,scan_id, charge, mono_mass, intensity
                FROM envelope
                WHERE scan_id = ?`;
    let dbDir = dir.substr(0, dir.lastIndexOf(".")) + ".db";
    let resultDb = new sqlite3.Database(dbDir, (err) => {
        if (err) {
            console.error(err.message);
        }
        // console.log('Connected to the result database.');
    });
    resultDb.all(sql,[scanID], (err, rows) => {
        if (err) {
            console.error(err.message);
        }
        //console.log(row);
        return callback(null, rows);
    });
    resultDb.close();
}
function getNextLevelOneScan(dir, scanNum, callback) {
    let sql = `SELECT SCAN AS scan
                FROM SPECTRA
                WHERE SCAN > ? AND SCANLEVEL =2
                LIMIT 1;`;
    let dbDir = dir.substr(0, dir.lastIndexOf(".")) + ".db";
    let resultDb = new sqlite3.Database(dbDir, (err) => {
        if (err) {
            console.error(err.message);
        }
        // console.log('Connected to the result database.');
    });
    resultDb.get(sql,[scanNum], (err, row) => {
        if (err) {
            console.error(err.message);
        }
        //console.log(row);
        return callback(null, row);
    });
    resultDb.close();
}

function getAllSeq(dir) {
    let dbDir = dir.substr(0, dir.lastIndexOf(".")) + ".db";
    let resultDb = new BetterDB(dbDir);
    let stmt = resultDb.prepare(`SELECT SPECTRA.ID AS scanID, SPECTRA.SCAN AS scan, sequence.protein_accession AS protein_accession, sequence.proteoform AS proteoform
                                FROM sequence INNER JOIN SPECTRA ON sequence.scan_id = SPECTRA.ID`);
    if(stmt.all()) {
        let seqResult = stmt.all();
        resultDb.close();
        return seqResult;
    } else {
        resultDb.close();
        return 0;
    }
}

function getProteoform(dir, scanNum) {
    let dbDir = dir.substr(0, dir.lastIndexOf(".")) + ".db";
    let resultDb = new BetterDB(dbDir);
    let stmt = resultDb.prepare(`SELECT sequence.proteoform AS proteoform
                FROM SPECTRA INNER JOIN sequence ON SPECTRA.ID = sequence.scan_id
                WHERE SPECTRA.SCAN = ?`);
    if(stmt.get(scanNum)) {
        let proteoform = stmt.get(scanNum).proteoform;
        resultDb.close();
        return proteoform;
    } else {
        resultDb.close();
        return 0;
    }
}
function getScanLevelTwoList(dir, scanID, callback) {
    let sql = `SELECT LevelTwoScanID AS scanID,
                    PREC_MZ AS prec_mz,
                    PREC_CHARGE AS prec_charge,
                    PREC_INTE AS prec_inte,
                    RETENTIONTIME AS rt
           FROM ScanPairs INNER JOIN SPECTRA ON ScanPairs.LevelTwoScanID = SPECTRA.SCAN
           WHERE LevelOneScanID = ?`;
    let dbDir = dir.substr(0, dir.lastIndexOf(".")) + ".db";
    let resultDb = new sqlite3.Database(dbDir, (err) => {
        if (err) {
            console.error(err.message);
        }
    });
    resultDb.all(sql, [scanID], (err, rows) => {
        if (err) {
            throw err;
        }
        return callback(null, rows);
    });
    resultDb.close();
}
function getScanRange(dir, callback) {
    let sql = `SELECT MIN(SCAN) AS minScan, MAX(SCAN) AS maxScan
                FROM SPECTRA`;
    let dbDir = dir.substr(0, dir.lastIndexOf(".")) + ".db";
    let resultDb = new sqlite3.Database(dbDir, (err) => {
        if (err) {
            console.error(err.message);
        }
        // console.log('Connected to the result database.');
    });
    resultDb.get(sql, (err, row) => {
        if (err) {
            console.error(err.message);
        }
        //console.log(row);
        return callback(null, row);
    });
    resultDb.close();
}
function openDB(dir, callback) {
    let dbDir = dir.substr(0, dir.lastIndexOf(".")) + ".db";
    let resultDb = new sqlite3.Database(dbDir, (err) => {
        if (err) {
            console.error(err.message);
        }
        //console.log('Connected to the result database.' + dbDir);
    });
}
function authGoogleSignUp(token, callback) {
    async function verify() {
        let ticket = await client.verifyIdToken({
            idToken: token,
            audience: CLIENT_ID,  // Specify the CLIENT_ID of the app that accesses the backend
            // Or, if multiple clients access the backend:
            //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
        });
        let payload = ticket.getPayload();
        let uid = payload.sub;
        let email;
        if (payload.email_verified) {
            email = payload.email;
        } else {
            email = null;
        }
        let firstName = payload.given_name;
        let lastName = payload.family_name;
        let fullName = payload.name;
        console.log(payload);
        console.log(uid, email, firstName, lastName, fullName);
        console.log(typeof uid);
        insertUser(db, uid, email, firstName, lastName, fullName);
        callback(uid);
        // If request specified a G Suite domain:
        //const domain = payload['hd'];
    }
    verify().catch(console.error);
}
function getPeakList(dir, scan, callback) {
    let sql = `SELECT MZ AS mz,
                  INTENSITY AS intensity
           FROM PEAKS INNER JOIN SPECTRA ON PEAKS.SPECTRAID=SPECTRA.ID
           WHERE SCAN = ?`;
           //ORDER BY INTENSITY DESC`;
            //LIMIT 1000`;
    let dbDir = dir.substr(0, dir.lastIndexOf(".")) + ".db";
    let resultDb = new sqlite3.Database(dbDir, (err) => {
        if (err) {
            console.error(err.message);
        }
        //console.log('Connected to the result database.' + dbDir);
    });
    resultDb.all(sql, [scan], (err, rows) => {
        if (err) {
            throw err;
        }
        return callback(null, rows);
        //console.log(`${row.MZ} - ${row.INTENSITY}`);
        // var data = JSON.stringify(rows);
        // fs.writeFileSync('result.json', data);
    });
    resultDb.close();
}
function getSumList(dir, callback) {
    let sql = `SELECT RETENTIONTIME AS rt,
                PEAKSINTESUM AS inteSum,
                SCAN AS scanNum
                FROM SPECTRA
                WHERE SCANLEVEL = 1`;
    //ORDER BY INTENSITY DESC`;
    //LIMIT 1000`;
    let dbDir = dir.substr(0, dir.lastIndexOf(".")) + ".db";
    let resultDb = new sqlite3.Database(dbDir, (err) => {
        if (err) {
            console.error(err.message);
        }
        //console.log('Connected to the result database.' + dbDir);
    });
    resultDb.all(sql, (err, rows) => {
        if (err) {
            throw err;
        }
        return callback(null, rows);
        //console.log(`${row.MZ} - ${row.INTENSITY}`);
        // var data = JSON.stringify(rows);
        // fs.writeFileSync('result.json', data);
    });
    resultDb.close();
}
function getScanID(dir, id, callback) {
    let sql = `SELECT SCAN AS scanID
           FROM SPECTRA
           WHERE ID = ?`;
    let dbDir = dir.substr(0, dir.lastIndexOf(".")) + ".db";
    let resultDb = new sqlite3.Database(dbDir, (err) => {
        if (err) {
            console.error(err.message);
        }
        //console.log('Connected to the result database.');
    });
    resultDb.get(sql, [id], (err, row) => {
        if (err) {
            throw err;
        }
        return callback(null, row);
    });
    resultDb.close();
}
function getPrecMZ(dir, scanID, callback) {
    let sql = `SELECT PREC_MZ AS precMZ
           FROM SPECTRA
           WHERE SCAN = ?`;
    let dbDir = dir.substr(0, dir.lastIndexOf(".")) + ".db";
    let resultDb = new sqlite3.Database(dbDir, (err) => {
        if (err) {
            console.error(err.message);
        }
        //console.log('Connected to the result database.');
    });
    resultDb.get(sql, [scanID], (err, row) => {
        if (err) {
            throw err;
        }
        return callback(null, row);
    });
    resultDb.close();
}
function getPrev(dir, scanID, callback) {
    let sql = `SELECT PREV AS prev
           FROM SPECTRA
           WHERE SCAN = ?`;
    let dbDir = dir.substr(0, dir.lastIndexOf(".")) + ".db";
    let resultDb = new sqlite3.Database(dbDir, (err) => {
        if (err) {
            console.error(err.message);
        }
        //console.log('Connected to the result database.');
    });
    resultDb.get(sql, [scanID], (err, row) => {
        if (err) {
            throw err;
        }
        return callback(null, row);
    });
    resultDb.close();
}
function getNext(dir, scanID, callback) {
    let sql = `SELECT NEXT AS next
           FROM SPECTRA
           WHERE SCAN = ?`;
    let dbDir = dir.substr(0, dir.lastIndexOf(".")) + ".db";
    let resultDb = new sqlite3.Database(dbDir, (err) => {
        if (err) {
            console.error(err.message);
        }
        //console.log('Connected to the result database.');
    });
    resultDb.get(sql, [scanID], (err, row) => {
        if (err) {
            throw err;
        }
        return callback(null, row);
    });
    resultDb.close();
}
function getScanLevel(dir, scanID, callback) {
    let sql = `SELECT SCANLEVEL AS scanLevel
           FROM SPECTRA
           WHERE SCAN = ?`;
    let dbDir = dir.substr(0, dir.lastIndexOf(".")) + ".db";
    let resultDb = new sqlite3.Database(dbDir, (err) => {
        if (err) {
            console.error(err.message);
        }
        //console.log('Connected to the result database.');
    });
    resultDb.get(sql, [scanID], (err, row) => {
        if (err) {
            throw err;
        }
        return callback(null, row);
    });
    resultDb.close();
}
function getRelatedScan1(dir, scanID, callback) {
    let sql = `SELECT LevelTwoScanID
           FROM ScanPairs
           WHERE LevelOneScanID = ?
           LIMIT 1`;
    let dbDir = dir.substr(0, dir.lastIndexOf(".")) + ".db";
    let resultDb = new sqlite3.Database(dbDir, (err) => {
        if (err) {
            console.error(err.message);
        }
        //console.log('Connected to the result database.');
    });
    resultDb.get(sql, [scanID], (err, row) => {
        if (err) {
            throw err;
        }
        return callback(null, row);
    });
    resultDb.close();
}
function getRelatedScan2(dir, scanID, callback) {
    let sql = `SELECT LevelOneScanID
           FROM ScanPairs
           WHERE LevelTwoScanID = ?
           LIMIT 1`;
    let dbDir = dir.substr(0, dir.lastIndexOf(".")) + ".db";
    let resultDb = new sqlite3.Database(dbDir, (err) => {
        if (err) {
            console.error(err.message);
        }
        //console.log('Connected to the result database.');
    });
    resultDb.get(sql, [scanID], (err, row) => {
        if (err) {
            throw err;
        }
        return callback(null, row);
    });
    resultDb.close();
}
function getFileName(db, id, callback) {
    let sql = `SELECT file_name as name,
                    file_path as path
             FROM files
             WHERE file_id  = ?`;
    db.get(sql, [id], (err, row) => {
        if (err) {
            return callback(err);
        }
        else {
            return callback(null, row.name);
        }
    });
}

function getProjects(db, uid,callback) {
    let sql = `SELECT ProjectName AS projectName, ProjectCode AS projectCode, FileName AS fileName, ProjectStatus AS projectStatus, EnvelopeStatus AS envStatus, SequenceStatus AS seqStatus, Description AS description, datetime(Date, 'localtime') AS uploadTime, MS1_envelope_file AS envelopeFile
                FROM Projects
                WHERE (ProjectStatus = 1 OR ProjectStatus = 0) AND uid = ?;`;
    db.all(sql,[uid], (err, rows) => {
        if(err) {
            return callback(err);
        }else {
            return callback(rows);
        }
    });
}

function getProjectsGuest(db,callback) {
    let sql = `SELECT ProjectName AS projectName, ProjectCode AS projectCode, FileName AS fileName, ProjectStatus AS projectStatus, EnvelopeStatus AS envStatus, SequenceStatus AS seqStatus, Description AS description, datetime(Date, 'localtime') AS uploadTime, MS1_envelope_file AS envelopeFile
                FROM Projects
                WHERE ProjectStatus = 1 AND public = 'true'`;
    db.all(sql,[], (err, rows) => {
        if(err) {
            return callback(err);
        }else {
            return callback(rows);
        }
    });
}
function ifExists(db, base64_code, callback) {
    let sql = `SELECT ProjectID as id
             FROM Projects
             WHERE ProjectCode  = ?`;
    // first row only
    db.get(sql, [base64_code], (err, row) => {
        if (err) {
            return callback(err);
        }
        else {
            if (row === undefined)
            return callback(null, false);
        }

    });
}

function ifEnvExists(db,ProjectCode, callback) {
    let sql = `SELECT EnvelopeStatus
             FROM Projects
             WHERE ProjectCode  = ?`;
    db.get(sql, [ProjectCode], (err, row) => {
        if (err) {
            return callback(err);
        }
        else {
            return callback(null, row);
        }
    });
}

function checkExpiredProj(db, callback) {
    var sql = `SELECT projectCode AS pcode,
            projectDir AS dir,
            fileName AS fileName
            FROM Projects
            WHERE datetime(Date, 'localtime') <= datetime('now', '-30 day', 'localtime') AND ProjectStatus != 3`;

    db.all(sql,(err, rows) => {
        if (err) {
            throw err;
        }
        else {
            return callback(null, rows);
        }
    });
}

function insertRow(db, ProjectCode, ProjectName, FileName, Description, ProjectDir, ProjectStatus, Email, EnvStatus, SeqStatus, ms1EnvFile,uid,public) {
    let sql = 'INSERT INTO Projects(ProjectCode, ProjectName, FileName, Description, ProjectDir, ProjectStatus, Email, EnvelopeStatus, SequenceStatus, MS1_envelope_file, uid,public) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)';
    db.run(sql, [ProjectCode,ProjectName,FileName,Description,ProjectDir,ProjectStatus,Email,EnvStatus,SeqStatus,ms1EnvFile,uid,public], function(err) {
        if (err) {
            return console.log(err.message);
        }
        // get the last insert id
        console.log(`A row has been inserted with rowid ${this.lastID}`);
    });
}
function insertUser(db, uid, email, firstname, lastname, fullname){
    let sql = 'INSERT INTO Users(uid, email, firstname, lastname, fullname) VALUES(?,?,?,?,?)';
    db.run(sql, [uid, email, firstname, lastname, fullname], function(err) {
        if (err) {
            return console.log(err.message);
        }
        // get the last insert id
        console.log(`A row has been inserted with rowid ${this.lastID}`);
    });
}
let db = new sqlite3.Database('./db/projectDB.db', sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to the projectDB.db database.');
    var sqlToCreateTable = "CREATE TABLE IF NOT EXISTS \"Projects\" ( `ProjectID` INTEGER NOT NULL, `ProjectCode` TEXT NOT NULL UNIQUE, `ProjectName` TEXT NOT NULL, `FileName` TEXT NOT NULL, `Description` TEXT NULL, `ProjectDir` TEXT NOT NULL, `ProjectStatus` INTEGER NOT NULL, `Email` TEXT NOT NULL, `Date` TEXT DEFAULT CURRENT_TIMESTAMP, 'EnvelopeStatus' INTEGER NOT NULL, 'SequenceStatus' INTEGER NOT NULL, 'MS1_envelope_file' TEXT NULL, 'uid' TEXT NULL, 'public' INTEGER NOT NULL ,PRIMARY KEY(`ProjectID`))";
    db.run(sqlToCreateTable, function (err) {
        if (err) {
            return console.log(err.message);
        }
        console.log("Table for project is ready!");
        var sqlToCreateIndex = "CREATE INDEX IF NOT EXISTS `project_index` ON `Projects` ( `ProjectCode` )";
        db.run(sqlToCreateIndex, function (err) {
            if (err) {
                return console.log(err.message);
            }
            console.log("Index for project is ready!");
        });

        var sqlToUserTable = "CREATE TABLE IF NOT EXISTS \"Users\" ( `uid` TEXT NOT NULL, `email` TEXT NULL, `firstname` TEXT NULL, `lastname` TEXT NULL, `fullname` TEXT NULL, PRIMARY KEY(`uid`) )";
        db.run(sqlToUserTable, function (err) {
            if (err) {
                return console.log(err.message);
            }
            console.log("Table for Users is ready!");
            var sqlToUserIndex = "CREATE INDEX IF NOT EXISTS `users_index` ON `users` ( `email` )";
            db.run(sqlToUserIndex, function (err) {
                if (err) {
                    return console.log(err.message);
                }
                console.log("Index for Users is ready!");
            });
        })

    });
});

var transport = nodemailer.createTransport({
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

process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            return console.error(err.message);
        }
        console.log('Close the database connection.');
        server.close(()=> {
            console.log('Server closed!');
            process.exit(0);
        });
    });
});