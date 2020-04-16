var fs = require('fs');
var rimraf = require("rimraf");
var archiver = require('archiver');
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
const os = require('os');
const cpuCount = os.cpus().length;
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
const { execFile, exec } = require('child_process');
const CronJob = require('cron').CronJob;
const molecularFormulae = require('./distribution_calc/molecularformulae');
const calcDistrubution = new molecularFormulae();
const BetterDB = require('better-sqlite3');

// Check expired projects every day midnight
/**
 * Create a CronJob to check expired projects every day midnight, if expired then remove projects
 *
 * @async
 * @type {CronJob}
 */
const job = new CronJob('00 00 00 * * *', function() {
    const d = new Date();
    console.log('Check expired projects:', d);
    checkExpiredProj(db, function (err, rows) {
        rows.forEach(element => {
            removeProject(element.pcode);
            /*fs.unlink(element.dir, (err) => {
                if (err) throw err;
                console.log(`${element.fileName} was deleted`);
            });
            let dbDir = element.dir.substr(0, element.dir.lastIndexOf(".")) + ".db";
            fs.unlink(dbDir, (err) => {
                if (err) throw err;
                console.log(`${dbDir} was deleted`);
            });
            updateProjectStatusSync(3, element.pcode);*/
        });
    });
});
job.start();

var avaiResourse = cpuCount - 2;
console.log("cpuCount", cpuCount);
// Check waiting tasks in database every second
/**
 * Create a task scheduler for topview app
 * It will check Tasks table in project database every second, if taskList is not empty then check
 * whether it has enough resources, if there are available resources then execute tasks, if not then check again
 * next second.
 *
 * @type {CronJob}
 */
const checkWaitTasks = new CronJob("* * * * * *", function() {
    // console.log("Check waiting tasks in database");
    let tasksList = getTaskListSync();
    // console.log("tasksList", tasksList);
    if (tasksList !== undefined) {
        for (let i = 0; i < tasksList.length; i++) {
            let task = tasksList[i];
            let threadNum = task.threadNum;
            let projectCode = task.projectCode;
            if(threadNum <= avaiResourse) {
                // console.log("Available resources");
                let projectStatus = checkProjectStatusSync(projectCode).projectStatus;
                console.log("projectStatus", projectStatus);
                if (projectStatus === 0) {
                    console.log("This project is processing, skip it");
                    return;
                } else if (projectStatus === 2 || projectStatus ===3) {
                    console.log("This project is removed or failed, skip it");
                    return;
                }else {
                    console.log("Processing project...");
                    let taskID = task.taskID;
                    let app = task.app;
                    let parameter = task.parameter;
                    let projectname = task.projectName;
                    let fname = task.fname;
                    let emailtosend = task.email;
                    let adr =  'https://toppic.soic.iupui.edu/data?id=';

                    avaiResourse = avaiResourse - threadNum;
                    updateProjectStatusSync(0, projectCode);
                    exec(app+' '+parameter, {maxBuffer: 1024 * 50000}, (err, stdout, stderr) => {
                        console.log(stdout);
                        console.log(stderr);
                        if(err) {
                            console.log(err);
                            updateTaskStatusSync(1, taskID);
                            avaiResourse = avaiResourse + threadNum;
                            setTimeout(function () {
                                processFailure(db,projectCode, function (err) {
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
                            }, 60000);
                        }else{
                            updateTaskStatusSync(1, taskID);
                            avaiResourse = avaiResourse + threadNum;
                            let remainingTask = checkRemainingTask(projectCode);
                            if (remainingTask === 1) {
                                updateProjectStatusSync(4, projectCode);
                                message.text = "Project Name: " + projectname + "\nFile Name: " + fname + "\nLink: " + adr + projectCode + '\nStatus: Done';
                                message.subject = "Your data processing is done";
                                message.to = emailtosend;
                                transport.sendMail(message, function(err, info) {
                                    if (err) {
                                        console.log(err)
                                    } else {
                                        console.log(info);
                                    }
                                });
                                /*updateProjectStatus(db,4, projectCode, function (err) {

                                });*/
                            } else {
                                updateProjectStatusSync(1,projectCode);
                                message.text = "Project Name: " + projectname + "\nFile Name: " + fname + "\nLink: " + adr + projectCode + '\nStatus: Done';
                                message.subject = "Your data processing is done";
                                message.to = emailtosend;
                                transport.sendMail(message, function(err, info) {
                                    if (err) {
                                        console.log(err)
                                    } else {
                                        console.log(info);
                                    }
                                });
                                /*updateProjectStatus(db,1, projectCode, function (err) {

                                });*/
                            }
                        }
                    });
//                         updateProjectStatus(db,0, projectCode, function (err) {
//                             exec(app+' '+parameter, (err, stdout, stderr) => {
//                                 console.log(stdout);
//                                 console.log(stderr);
//                                 if(err) {
//                                     setTimeout(function () {
//                                         processFailure(db,projectCode, function (err) {
//                                             console.log("Process failed!");
//                                             message.text = "Project Name: " + projectname + "\nFile Name: " + fname + '\nProject Status: Cannot process your dataset, please check your data.';
//                                             message.subject = "Your data processing failed";
//                                             message.to = emailtosend;
//                                             transport.sendMail(message, function(err, info) {
//                                                 if (err) {
//                                                     console.log(err)
//                                                 } else {
//                                                     console.log(info);
//                                                 }
//                                             });
//                                         });
//                                         console.log(err);
//                                         updateTaskStatusSync(1, taskID);
//                                         avaiResourse = avaiResourse + threadNum;
//                                         return;
// /*                                        updateTaskStatusAsync(db, 1, taskID, function (err) {
//                                             avaiResourse = avaiResourse + threadNum;
//                                             return;
//                                         })*/
//                                     }, 60000);
//                                 }else{
//                                     updateTaskStatusSync(1, taskID);
//                                     avaiResourse = avaiResourse + threadNum;
//                                     let remainingTask = checkRemainingTask(projectCode);
//                                     if (remainingTask === 1) {
//                                         updateProjectStatus(db,4, projectCode, function (err) {
//                                             message.text = "Project Name: " + projectname + "\nFile Name: " + fname + "\nLink: " + adr + projectCode + '\nStatus: Done';
//                                             message.subject = "Your data processing is done";
//                                             message.to = emailtosend;
//                                             transport.sendMail(message, function(err, info) {
//                                                 if (err) {
//                                                     console.log(err)
//                                                 } else {
//                                                     console.log(info);
//                                                 }
//                                             });
//                                         });
//                                     } else {
//                                         updateProjectStatus(db,1, projectCode, function (err) {
//                                             message.text = "Project Name: " + projectname + "\nFile Name: " + fname + "\nLink: " + adr + projectCode + '\nStatus: Done';
//                                             message.subject = "Your data processing is done";
//                                             message.to = emailtosend;
//                                             transport.sendMail(message, function(err, info) {
//                                                 if (err) {
//                                                     console.log(err)
//                                                 } else {
//                                                     console.log(info);
//                                                 }
//                                             });
//                                         });
//                                     }
//                                     /*updateTaskStatusAsync(db, 1, taskID, function (err) {
//                                         avaiResourse = avaiResourse + threadNum;
//                                         let remainingTask = checkRemainingTask(projectCode);
//                                         if (remainingTask === 1) {
//                                             updateProjectStatus(db,4, projectCode, function (err) {
//                                                 message.text = "Project Name: " + projectname + "\nFile Name: " + fname + "\nLink: " + adr + projectCode + '\nStatus: Done';
//                                                 message.subject = "Your data processing is done";
//                                                 message.to = emailtosend;
//                                                 transport.sendMail(message, function(err, info) {
//                                                     if (err) {
//                                                         console.log(err)
//                                                     } else {
//                                                         console.log(info);
//                                                     }
//                                                 });
//                                             });
//                                         } else {
//                                             updateProjectStatus(db,1, projectCode, function (err) {
//                                                 message.text = "Project Name: " + projectname + "\nFile Name: " + fname + "\nLink: " + adr + projectCode + '\nStatus: Done';
//                                                 message.subject = "Your data processing is done";
//                                                 message.to = emailtosend;
//                                                 transport.sendMail(message, function(err, info) {
//                                                     if (err) {
//                                                         console.log(err)
//                                                     } else {
//                                                         console.log(info);
//                                                     }
//                                                 });
//                                             });
//                                         }
//                                     })*/
//                                 }
//                             })
//                         })
                }
            } else {
                console.log("No enough resources!");
                return;
            }
        }
    }
    /*getTaskListAsync(db, function (err, rows) {
        let tasksList = rows;
    })*/
});
checkWaitTasks.start();
// set the view engine to ejs
app.set('view engine', 'ejs');
app.use(compression());

// set favicon using express middleware
app.use(favicon(__dirname + '/public/image/favicon.ico'));

app.use(bodyParser.urlencoded({ extended: false }));

/**
 * Express router for main webpage
 *
 * Show all public projects in database to both guests and users
 */
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

/**
 * Express router for /submit
 * send submit.html page to user
 */
app.get('/submit', function (req, res) {
    res.sendFile( __dirname + "/public/" + "submit.html" );
});

/**
 * Express router for /logout
 *
 * clear session and redirect to home page
 */
app.get('/logout',(req, res)=> {
    req.logout();
    //req.session.destroy();
    req.session = null;
    res.redirect('/');
});

/**
 * Express router for /upload
 *
 * Save mzML file and env file (optional) to target directory
 * and save project information into project database,
 * then submit task to task scheduler
 */
app.post('/upload', function (req, res) {
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
        var emailtosend = email;
        var description = fields.description;
        var publicStatus = fields.public;
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
                                insertRowSync(db, id, projectname, fname, description,des_file,4, emailtosend,1,0,envFile1.name,uid,publicStatus);
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

                                let app = './cpp/bin/mzMLReader';
                                let parameter = des_file + ' -f';
                                submitTask(id, app, parameter,1);

                                app = 'node';
                                let dbDir = des_file.substr(0, des_file.lastIndexOf(".")) + ".db";
                                parameter = './convertEnv ' + dbDir + ' ' + des_envFile1;
                                submitTask(id, app, parameter, 1);

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

                    // execFile(__dirname + "/cpp/bin/mzMLReader", [des_file,'-f'], (err, stdout, stderr) => {
                    //     if(err) {
                    //         setTimeout(function () {
                    //             processFailure(db,id, function (err) {
                    //                 console.log("Process failed!");
                    //                 message.text = "Project Name: " + projectname + "\nFile Name: " + fname + '\nProject Status: Cannot process your dataset, please check your data.';
                    //                 message.subject = "Your data processing failed";
                    //                 message.to = emailtosend;
                    //                 transport.sendMail(message, function(err, info) {
                    //                     if (err) {
                    //                         console.log(err)
                    //                     } else {
                    //                         console.log(info);
                    //                     }
                    //                 });
                    //             });
                    //             console.log(err);
                    //             return;
                    //         }, 60000);
                    //     }
                    //     //console.log(`stdout: ${stdout}`);
                    //     let dbDir = des_file.substr(0, des_file.lastIndexOf(".")) + ".db";
                    //     execFile('node',[__dirname + '/convertEnv.js',dbDir,des_envFile1],((err, stdout, stderr) => {
                    //         if(err) {
                    //             setTimeout(function () {
                    //                 processFailure(db,id, function (err) {
                    //                     console.log("Process failed!");
                    //                     message.text = "Project Name: " + projectname + "\nFile Name: " + fname + '\nProject Status: Cannot process your dataset, please check your data.';
                    //                     message.subject = "Your data processing failed";
                    //                     message.to = emailtosend;
                    //                     transport.sendMail(message, function(err, info) {
                    //                         if (err) {
                    //                             console.log(err)
                    //                         } else {
                    //                             console.log(info);
                    //                         }
                    //                     });
                    //                 });
                    //                 console.log(err);
                    //                 return;
                    //             }, 60000);
                    //         }
                    //         //console.log(`stdout: ${stdout}`);
                    //         //console.log(data.toString());
                    //         else {
                    //             updateProjectStatus(db,1, id, function (err) {
                    //                 message.text = "Project Name: " + projectname + "\nFile Name: " + fname + "\nLink: " + adr + id + '\nStatus: Done';
                    //                 message.subject = "Your data processing is done";
                    //                 message.to = emailtosend;
                    //                 transport.sendMail(message, function(err, info) {
                    //                     if (err) {
                    //                         console.log(err)
                    //                     } else {
                    //                         console.log(info);
                    //                     }
                    //                 });
                    //             });
                    //
                    //         }
                    //     }));
                    // });
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
                            insertRowSync(id, projectname, fname,description,des_file,4, emailtosend,0,0,0,uid,publicStatus);
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

                            let app = './cpp/bin/mzMLReader';
                            let parameter = des_file + ' -f';
                            submitTask(id, app, parameter, 1);

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

                // execFile(__dirname + "/cpp/bin/mzMLReader", [des_file,'-f'], (err, stdout, stderr) => {
                //     if(err) {
                //         setTimeout(function () {
                //             processFailure(db,id, function (err) {
                //                 console.log("Process failed!");
                //                 message.text = "Project Name: " + projectname + "\nFile Name: " + fname + '\nProject Status: Cannot process your dataset, please check your data.';
                //                 message.subject = "Your data processing failed";
                //                 message.to = emailtosend;
                //                 transport.sendMail(message, function(err, info) {
                //                     if (err) {
                //                         console.log(err)
                //                     } else {
                //                         console.log(info);
                //                     }
                //                 });
                //             });
                //             console.log(err);
                //             return;
                //         }, 60000);
                //     }else{
                //         updateProjectStatus(db,1, id, function (err) {
                //             message.text = "Project Name: " + projectname + "\nFile Name: " + fname + "\nLink: " + adr + id + '\nStatus: Done';
                //             message.subject = "Your data processing is done";
                //             message.to = emailtosend;
                //             transport.sendMail(message, function(err, info) {
                //                 if (err) {
                //                     console.log(err)
                //                 } else {
                //                     console.log(info);
                //                 }
                //             });
                //         });
                //     }
                // });
            });
        }
    })
});

/**
 * Express router for /data
 *
 * Check project status and render result page back to users
 */
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
                    res.send("Your project failed.");
                    res.end();
                } else if (row.projectStatus === 3) {
                    console.log("Project status: 3");
                    res.send("Your project has been removed.");
                    res.end();
                } else if (row.projectStatus === 4) {
                    console.log("Project status: 4");
                    res.send("Your project is on the task wait list, please wait for result!");
                    res.end();
                }
            }
        }
    });
});

/**
 * Express router for /sequence
 *
 * Handle request to upload sequence file, delete current sequence information in database
 * then submit task to process sequence file
 */
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
            deleteSeq(projectDir, projectCode);
            updateSeqStatusSync(0,projectCode);
            res.end();
            let parameter = __dirname + '/sequenceParse.js ' + dbDir + ' ' + des_seq;
            submitTask(projectCode, 'node', parameter, 1);
            updateSeqStatusSync(1, projectCode);
            /*execFile('node',[__dirname + '/sequenceParse.js',dbDir,des_seq],((err, stdout, stderr) => {
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
            }))*/
        })
    })
});
/**
 * Express router for /seqQuery
 *
 * Query proteoform by projectCode and scan,
 * send back proteoform result to user
 */
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
/**
 * Express router for /updateSeq
 *
 * Handle request to update one proteoform in database by scan
 */
app.post('/updateSeq', function (req, res) {
    console.log('Hello updateSeq!');
    let uid;
    //console.log(req.session.passport.user.profile);
    if (!req.session.passport) {
        res.write('Unauthorized');
        res.end();
        return;
    } else {
        uid = req.session.passport.user.profile.id;
    }
    let projectCode = req.query.projectCode;
    let scanNum = req.query.scanNum;
    let proteoform = req.query.proteoform;
    getProjectSummary(db, projectCode, function (err, row) {
        let seqStatus = row.sequenceStatus;
        let projectDir = row.projectDir;
        let projectUid = row.uid;
        if (projectUid !== uid) {
            res.write('Unauthorized');
            res.end();
            return;
        }
        if(seqStatus === 1) {
            try {
                updateSeq(projectDir, proteoform, scanNum);
                res.write('1');
                res.end();
            } catch (e) {
                console.log(e);
                res.write('0');
                res.end();
            }
        } else {
            res.write('0');
            res.end();
        }
    })
});
/**
 * Express router for /msalign
 *
 * Handle request to upload msalign file, save files to project directory,
 * then delete current envelope peaks and submit process msalign file task to
 * task scheduler
 */
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
        deleteEnvPeak(dbDir, projectCode);

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
                res.end();
                let parameterTask1 = __dirname + '/convertMS1Msalign.js '+ dbDir + ' ' + des_ms1;
                submitTask(projectCode, 'node', parameterTask1, 1);

                let parameterTask2 = __dirname + '/convertMS2Msalign.js '+ dbDir + ' ' + des_ms2;
                submitTask(projectCode, 'node', parameterTask2, 1);
                updateEnvStatusSync(1, projectCode);



                /*updateProjectStatus(db,0, fields.projectCode, function () {
                    res.end();
                    execFile('node',[__dirname + '/convertMS1Msalign.js',dbDir,des_ms1],((err, stdout, stderr) => {
                        if(err) {
                            console.log(stdout);
                            sendFailureMess(db, projectName, projectCode, email);
                        }
                        execFile('node',[__dirname + '/convertMS2Msalign.js',dbDir,des_ms2],((err, stdout, stderr) => {
                            if(err) {
                                console.log(stdout);
                                sendFailureMess(db, projectName, projectCode, email);
                            } else {
                                sendSuccessMess(db, projectName, projectCode, email);
                                console.log('msalign file processing is done!');
                            }
                        }));
                    }));
                });*/
            })
        })
    })
});
/**
 * Express router for /auth/google/callback
 *
 * authenticate users by google, if there is a new user, then insert user information into Users table of database
 */
app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/' }),
    function(req, res) {
        //console.log('req.user.token',req.user.profile);
        let profile = req.user.profile;
        req.session.token = req.user.token;
        insertUser(db, profile.id, profile.emails[0].value,profile.name.givenName, profile.name.familyName, profile.displayName);
        res.redirect('/');
    });

/**
 * Express router for /seqResults
 *
 * Query proteoform list by projectCode and
 * render a sequence list web page to users
 */
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

/**
 * Express router for /projects
 *
 * Authenticate user by uid then
 * get a list which contains all projects the user owns and render the list back to user
 */
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
                } else if(row.projectStatus ===4) {
                    row.projectStatus = 'Waiting';
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
                row.editLink = '/projectManagement?projectCode=' + row.projectCode;
            });
            res.render('pages/projects', {
                projects: rows
            });
        });
    }

});
/**
 * Express router for /toppic
 *
 * Render a toppic task configure web page back to user
 */
app.get('/toppic', function (req, res) {
    if (req.session.passport === undefined) {
        res.write("Please log in first to use topic for your projecct");
        res.end();

    } else {
        // console.log(req.session.passport);
        // console.log(req.query.projectCode);
        let projectCode = req.query.projectCode;
        if (!projectCode) {
            res.write("No project selected for this topic task.");
            return;
        } else {
            res.render('pages/topicTask', {
                projectCode
            });
        }
    }
});
/**
 * Express router for /toppicTask
 *
 * Hanld request to generate a toppic task, save files and delete previous sequence information in database
 */
app.post('/toppicTask', function (req, res) {
    console.log("Hello, toppicTask");
    const app = './proteomics_cpp/bin/toppic';
    let commandArr = '';
    var form = new formidable.IncomingForm();
    form.maxFileSize = 5000 * 1024 * 1024; // 5gb file size limit
    form.encoding = 'utf-8';
    form.uploadDir = "tmp";
    form.keepExtensions = true;

    form.parse(req, function (err, fields, files) {
        var fastaFile = files.fastaFile;
        var lcmsFeatureFile = files.lcmsFeatureFile;
        var fixedPTMFile = files.fixedPTMFile;
        var ptmShiftFile = files.ptmShiftFile;
        var projectCode = fields.projectCode;
        var threadNum = fields.threadNum;
        var parameter = fields.command;
        console.log("parameter",parameter);
        console.log(projectCode);
        getProjectSummary(db, projectCode, function (err, row) {
            let envStatus = row.envelopeStatus;
            let projectDir = row.projectDir;
            let fileName = row.fileName;
            let msalign_name = fileName.substr(0, fileName.lastIndexOf(".")) + '_ms2.msalign';
            let msalign_dir = projectDir.substr(0, projectDir.lastIndexOf("/")) + '/' + msalign_name;
            var des_fastaFile = projectDir.substr(0, projectDir.lastIndexOf("/")) + '/' + fastaFile.name;
            fs.rename(fastaFile.path, des_fastaFile, function (err) {
                if (err) {
                    console.log(err);
                    return res.send({"error": 403, "message": "Error on saving file!"});
                }
                console.log("Files are saved.");
                console.log("msaling_dir", msalign_dir);
                if (!fs.existsSync(msalign_dir)) {
                    console.log('The msalign file does not exist.');
                    return res.send({"error": 403, "message": "Error on finding msalign file! Please run TopFD first!"});
                }

                if(fixedPTMFile !== undefined) {
                    var des_fixedPTMFile = projectDir.substr(0, projectDir.lastIndexOf("/")) + '/' + fixedPTMFile.name;
                    fs.renameSync(fixedPTMFile.path, des_fixedPTMFile);
                    parameter = parameter + ' -f '+ des_fixedPTMFile;
                }

                if (ptmShiftFile !== undefined) {
                    var des_ptmShiftFile = projectDir.substr(0, projectDir.lastIndexOf("/")) + '/' + ptmShiftFile.name;
                    fs.renameSync(ptmShiftFile.path, des_ptmShiftFile);
                    parameter = parameter + ' -i '+ des_ptmShiftFile;
                }

                commandArr = parameter + ' -u '+ threadNum + ' ' + des_fastaFile + ' ' + msalign_dir;
                console.log("commandArr",commandArr);
                console.log(threadNum);
                submitTask(projectCode,app, commandArr, threadNum);

                deleteSeq(projectDir, projectCode);
                updateSeqStatusSync(0, projectCode);
                let seqApp = 'node';
                let dbDir = projectDir.substr(0, projectDir.lastIndexOf(".")) + '.db';
                let seqName = fileName.substr(0, fileName.lastIndexOf(".")) + '_ms2_toppic_prsm.tsv';
                let seq_dir = projectDir.substr(0, projectDir.lastIndexOf("/")) + '/' + seqName;
                let seqParameter = './sequenceParse.js ' + dbDir + ' ' + seq_dir;
                console.log(seqParameter);
                updateSeqStatusSync(1, projectCode);
                submitTask(projectCode, seqApp, seqParameter, 1);
                res.end();
            })
        })
    })

});
/**
 * Express router for /topfd
 *
 * Render topfd configure page to user
 */
app.get('/topfd', function (req, res) {
    if (req.session.passport === undefined) {
        res.write("Please log in first to use topfd for your projecct");
        res.end();

    } else {
        // console.log(req.session.passport);
        // console.log(req.query.projectCode);
        let projectCode = req.query.projectCode;
        if (!projectCode) {
            res.write("No project selected for this topfd task.");
            return;
        } else {
            res.render('pages/task', {
                projectCode
            });
        }
    }
});
/**
 * Express router for /topfdTask
 *
 * Handle request to create a topFD task, generate parameter for task and delete previous envelope peaks
 */
app.get('/topfdTask', function (req,res) {
    const app = './proteomics_cpp/bin/topfd';
    let commandArr = '';
    let projectCode = req.query.projectCode;

    // console.log(req.query);
    let maximumCharge = req.query.Maximum_charge;
    if (maximumCharge !== '') {
        commandArr += '-c ';
        commandArr += maximumCharge;
    }

    let maximumMass = req.query.Maximum_mass;
    if (maximumMass !== '') {
        commandArr += ' -m ';
        commandArr += maximumMass;
    }
    let ms1SignalNoiseRatio = req.query.MS1_signal_noise_ratio;
    if (ms1SignalNoiseRatio !== '') {
        commandArr += ' -r ';
        commandArr += ms1SignalNoiseRatio;
    }

    let msMsSignalNoiseRatio = req.query.MS_MS_signal_noise_ratio;
    if (msMsSignalNoiseRatio !== '') {
        commandArr += ' -t ';
        commandArr += msMsSignalNoiseRatio;
    }

    let mzError = req.query.M_Z_error;
    if (mzError !== '') {
        commandArr += ' -e ';
        commandArr += mzError;
    }

    let precursorWindow = req.query.Precursor_window;
    if (precursorWindow !== '') {
        commandArr += ' -w ';
        commandArr += precursorWindow;
    }

    let msSpectra = req.query.MS_Spectra;
    if (msSpectra === 'on') {
        commandArr += ' -o';
    }

    let threadNumber = req.query.thread_number;
    if (threadNumber !== '') {
        commandArr += ' -u ';
        commandArr += threadNumber;
    }

    let resultDb = new BetterDB('./db/projectDB.db');
    let stmt = resultDb.prepare(`SELECT ProjectDir AS projectDir, FileName AS fileName
                                FROM Projects
                                WHERE projectCode = ?;`);
    let result = stmt.get(projectCode);
    resultDb.close();
    // console.log(result);
    let projectDir;
    if (result) {
        projectDir = result.projectDir;
        commandArr += ' ';
        commandArr += projectDir;
        // console.log(projectDir);
        // console.log(commandArr);
        deleteEnvPeak(projectDir, projectCode);
        submitTask(projectCode, app, commandArr, threadNumber);
        let fileName = result.fileName.substr(0, result.fileName.lastIndexOf("."));
        let dbDir = projectDir.substr(0, projectDir.lastIndexOf(".")) + '.db';
        let des_ms1 = projectDir.substr(0, projectDir.lastIndexOf("/")) + '/'+ fileName + '_file/' + fileName + '_ms1.msalign';
        let des_ms2 = projectDir.substr(0, projectDir.lastIndexOf("/")) + '/'+ fileName + '_ms2.msalign';

        updateEnvStatusSync(1, projectCode);
        submitTask(projectCode, 'node','./convertMS1Msalign.js ' + dbDir + ' ' + des_ms1, 1);
        submitTask(projectCode, 'node','./convertMS2Msalign.js ' + dbDir + ' ' + des_ms2, 1);
    } else {
        res.write("No such project exists!");
        res.end();
        return;
    }
    res.sendFile(__dirname + '/public/backToHome.html');
    // res.redirect('/');
    // res.write('Your task is submitted, please wait for result! Please go back to home page to wait result: <a href ="https://toppic.soic.iupui.edu/">Home</a>');
    // res.end();
});
/**
 * Express router for /projectManagement
 *
 * Render project management page to user
 */
app.get('/projectManagement', function (req, res) {
    if (req.session.passport === undefined){
        res.write("Please log in first!");
        res.end();
        return;
    }
    else {
        //console.log(req.session.passport.user.profile);
        const uid = req.session.passport.user.profile.id;
        const projectCode = req.query.projectCode;
        getProjectSummary(db, projectCode, function (err, row) {
            let projectName = row.projectName;
            let projectPublic = row.public;
            let projectDescription = row.description;
            let projectUid = row.uid;
            if(projectUid !== uid) {
                res.write("Please log in first!");
                res.end();
                return;
            }
            res.render('pages/projectManagement', {
                projectCode: projectCode,
                projectName: projectName,
                publicValue: projectPublic,
                description: projectDescription
            })
        });
    }

});
/**
 * Express router for /removeProject
 *
 * Remove project by projectCode
 */
app.post('/removeProject', function (req, res) {
    console.log("Hello, removeProject!");
    const projectCode = req.query.projectCode;
    getProjectSummary(db, projectCode, function (err, row) {
        let projectStatus = row.projectStatus;
        if (projectStatus === 3) {
            res.end();
            return;
        } else {
            removeProject(projectCode);
            res.end();
        }
    });
});
/**
 * Express router for /editProject
 *
 * Edit projectName, projectDescription, projectPublicStatus by projectCode
 */
app.post('/editProject', function (req,res) {
    console.log("Hello, editProject!");
    const projectCode = req.query.projectCode;
    const projectName = req.query.projectName;
    const description = req.query.description;
    const publicStatus = req.query.publicStatus;
    updateProjectNameSync(projectName, projectCode);
    updateDescriptionSync(description, projectCode);
    updatePublicStatusSync(publicStatus, projectCode);
    res.end();
});
/**
 * Express router for /deleteMsalign
 *
 * Delete current envelope peaks
 */
app.get('/deleteMsalign', function (req,res) {
    let projectDir = req.query.projectDir;
    let projectCode = req.query.projectCode;
    deleteEnvPeak(projectDir, projectCode);
    res.end();
});
/**
 * Express router for /deleteSeq
 *
 * Delete current sequence information
 */
app.get('/deleteSeq', function (req,res) {
    let projectDir = req.query.projectDir;
    let projectCode = req.query.projectCode;
    deleteSeq(projectDir,projectCode);
    updateSeqStatusSync(0,projectCode);
    res.end();
    /*deleteSeq(projectDir, projectCode, function () {
        updateSeqStatus(db,0, projectCode, function () {
            res.end();
        });
    });*/
});
/**
 * Express router for /download
 *
 * If envStatus is 0, then render mzML file to user.
 * IF envStatus is 1, then zip all results files then render zip back to user.
 */
app.get('/download', function (req,res) {
    let projectCode = req.query.id;
    getProjectSummary(db, projectCode, function (err,row) {
        let projectDir = row.projectDir;
        let projectName = row.projectName;
        let fileName = row.fileName;
        let envStatus = row.envelopeStatus;
        if (envStatus !== 1) {
            res.download(projectDir);
        } else {
            let fName = fileName.substr(0, fileName.lastIndexOf("."));
            let dbDir = projectDir.substr(0, projectDir.lastIndexOf("/"));

            let zipName = '/'+projectName+'.zip';
            var output = fs.createWriteStream(dbDir + zipName);

            var archive = archiver('zip', {
                zlib: { level: 9 } // Sets the compression level.
            });

            output.on('close', function() {
                console.log(archive.pointer() + ' total bytes');
                console.log('archiver has been finalized and the output file descriptor has closed.');
                res.download(dbDir + zipName);
            });

            archive.on('error', function(err) {
                throw err;
            });

            archive.pipe(output);

            var file1 = dbDir + '/' + fName + '_ms2.feature';
            var file2 = dbDir + '/' + fName + '_ms2.msalign';
            var file3 = dbDir + '/' + fName + '_ms1.feature';
            var file4 = dbDir + '/' + fName + '_feature.xml';
            var dir5 = dbDir + '/' + fName + '_file';
            archive
                .append(fs.createReadStream(file1), { name: fName + '_ms2.feature' })
                .append(fs.createReadStream(file2), { name: fName + '_ms2.msalign' })
                .append(fs.createReadStream(file3), { name: fName + '_ms1.feature' })
                .append(fs.createReadStream(file4), { name: fName + '_feature.xml' })
                .directory(dir5, fName + '_file')
                .finalize();
        }
    })
});
/**
 * Express router for /deleterow
 *
 * Delete multiple envelopes by envelope_id
 */
app.get('/deleterow', function (req,res) {
    console.log("Hello, deleterow!");
    let projectDir = req.query.projectDir;
    let envelopeIDs = req.query.envList;
    // console.log(envelopeIDs);
    deleteMultiEnvs(projectDir,envelopeIDs,function () {
        res.end();
    });
});
/**
 * Express router for /addrow
 *
 * Add one envelope and calculate its distribution then save it in existing database
 */
app.get('/addrow', function (req,res) {
    console.log("Hello, addrow!");
    let projectDir = req.query.projectDir;
    //let envID = req.query.envelope_id;
    let scan_id = req.query.scan_id;
    let charge = req.query.charge;
    let monoMass = req.query.mono_mass;
    let theoInteSum = req.query.intensity;
    getPeakListByScanID(projectDir, scan_id, function (rows) {
        let peakList = calcDistrubution.emass(monoMass,charge,rows);
        // console.log(peakList);
        if (!peakList) {
            console.log('No match!');
            // res.send(500, {errors: 'No peak match found!'});
            res.status(500).send({errors: 'No peak match found!'});
        } else {
            let peaksum = 0;
            peakList.forEach(peak => {
                peaksum = peaksum + peak.intensity;
            });
            theoInteSum = peaksum.toFixed(5);
            // console.log(theoInteSum);
            getEnvMax(projectDir,function (envID) {
                //console.log(envID);
                ++envID;
                addEnv(projectDir,envID,scan_id,charge,monoMass,theoInteSum,function () {
                    addEnvPeak(projectDir,charge,monoMass,scan_id,envID,function (err) {
                        if (err) {
                            console.log(err);
                            // res.status(500).send({errors: 'No peak match found!'});
                        }
                        getEnv(projectDir,envID,function (row) {
                            res.json(row);
                            res.end();
                        });
                    });
                });
            })
        }
    });
});

/**
 * Route serving edit row.
 * @name get/editrow
 * @function
 * @inner
 * @param {string} path - Express path
 * @param {callback} middleware - Express middleware.
 */
app.get('/editrow', function (req,res) {
    console.log("Hello, editrow!");
    let projectDir = req.query.projectDir;
    let scan_id = req.query.scan_id;
    let envID = req.query.envelope_id;
    let charge = req.query.charge;
    let monoMass = req.query.mono_mass;
    let theoInteSum = req.query.intensity;

    getPeakListByScanID(projectDir, scan_id, function (rows) {
        let peakList = calcDistrubution.emass(monoMass,charge,rows);
        // console.log(peakList);
        if (!peakList) {
            // console.log('No match!');
            // res.send(500, {errors: 'No peak match found!'});
            res.status(500).send({errors: 'No peak match found!'});
        } else {
            let peaksum = 0;
            peakList.forEach(peak => {
                peaksum = peaksum + peak.intensity;
            });
            theoInteSum = peaksum.toFixed(5);
            // console.log(theoInteSum);
            editEnv(projectDir,envID,charge,monoMass,theoInteSum,function () {
                addEnvPeak(projectDir,charge,monoMass,scan_id,envID,function () {
                    getEnv(projectDir,envID,function (row) {
                        res.json(row);
                        res.end();
                    });
                });
            })
        }
    });
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
    getProjectSummary(db, projectCode, function (err, row) {


    })
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
function getTaskListSync() {
    let resultDb = new BetterDB('./db/projectDB.db');
    let stmt = resultDb.prepare(`SELECT Tasks.ID AS taskID, Tasks.projectCode AS projectCode, Tasks.app AS app, Tasks.parameter AS parameter, Tasks.finish AS finish, Tasks.threadNum AS threadNum, Projects.ProjectName AS projectName, Projects.FileName AS fname, Projects.Email AS email, Projects.ProjectStatus AS projectStatus
                FROM Tasks INNER JOIN Projects ON Tasks.projectCode = Projects.ProjectCode
                WHERE Tasks.finish = 0 AND Projects.ProjectStatus = 4;`);
    let tasksList = stmt.all();
    resultDb.close();
    return tasksList;
}
function getTaskListAsync(db, callback) {
    let sql = `SELECT Tasks.ID AS taskID, Tasks.projectCode AS projectCode, Tasks.app AS app, Tasks.parameter AS parameter, Tasks.finish AS finish, Tasks.threadNum AS threadNum, Projects.ProjectName AS projectName, Projects.FileName AS fname, Projects.Email AS email, Projects.ProjectStatus AS projectStatus
                FROM Tasks INNER JOIN Projects ON Tasks.projectCode = Projects.ProjectCode
                WHERE Tasks.finish = 0 AND Projects.ProjectStatus = 4;`;

    db.all(sql, [], (err, rows) => {
        if(err) {
            console.error(err.message);
            throw err;
        }
        return callback(err, rows);
    });
}
function checkProjectStatusAsync(db, projectCode, callback) {
    let sql = `SELECT Projects.ProjectStatus AS projectStatus
                                FROM Tasks INNER JOIN Projects ON Tasks.projectCode = Projects.ProjectCode
                                WHERE Tasks.projectCode = ?;`;
    db.get(sql,[projectCode], function (err, row) {
        if (err) {
            console.error(err.message);
            return err;
        }
        return callback(err, row);
    })
}
function updateProjectStatusSync(status, projectCode) {
    let resultDb = new BetterDB('./db/projectDB.db');
    let stmt = resultDb.prepare(`UPDATE Projects
                SET ProjectStatus = ?
                WHERE ProjectCode = ?`);
    let info = stmt.run(status, projectCode);
    console.log('info', info);
    resultDb.close();
}
function updateTaskStatusAsync(db, status, taskID, callback) {
    let sql = `UPDATE Tasks
                SET finish = ?
                WHERE id = ?`;
    db.run(sql, [status,taskID], function (err) {
        if (err) {
            return console.error(err.message);
        }
        console.log(`Row(s) updated: ${this.changes}`);
        return callback(null);
    });
}
function updateTaskStatusSync(status, taskID) {
    let resultDb = new BetterDB('./db/projectDB.db');
    let stmt = resultDb.prepare(`UPDATE Tasks
                SET finish = ?
                WHERE id = ?`);
    let info = stmt.run(status, taskID);
    // console.log('info', info);
    resultDb.close();
}
function checkProjectStatusSync(projectCode) {
    let resultDb = new BetterDB('./db/projectDB.db');
    let stmt = resultDb.prepare(`SELECT Projects.ProjectStatus AS projectStatus
                                FROM Tasks INNER JOIN Projects ON Tasks.projectCode = Projects.ProjectCode
                                WHERE Tasks.projectCode = ?;`);
    let queryResult = stmt.get(projectCode);
    resultDb.close();
    return queryResult;
}
function checkRemainingTask(projectCode) {
    let resultDb = new BetterDB('./db/projectDB.db');
    let stmt = resultDb.prepare(`SELECT Projects.ProjectStatus AS projectStatus
                                FROM Tasks INNER JOIN Projects ON Tasks.projectCode = Projects.ProjectCode
                                WHERE Tasks.projectCode = ? AND Tasks.finish = 0;`);
    let queryResult = stmt.get(projectCode);
    resultDb.close();

    if (queryResult === undefined) {
        return 0;
    } else {
        return 1;
    }
}
function submitTask(projectCode, app, parameter, threadNum) {
    let queryResult = checkProjectStatusSync(projectCode);

    if (queryResult === undefined) {
        updateProjectStatusSync(4, projectCode);
        insertTaskSync(projectCode, app, parameter,threadNum, 0);
    } else if (queryResult.projectStatus === 2 || queryResult.projectStatus === 3) {
        return;
    } else if (queryResult.projectStatus === 0) {
        insertTaskSync(projectCode, app, parameter,threadNum, 0);
    } else {
        updateProjectStatusSync(4, projectCode);
        insertTaskSync(projectCode, app, parameter,threadNum, 0);
    }

}
function updateEnvStatusSync(status, id) {
    let resultDb = new BetterDB('./db/projectDB.db');
    let stmt = resultDb.prepare(`UPDATE Projects
                SET EnvelopeStatus = ?
                WHERE ProjectCode = ?`);
    let info = stmt.run(status, id);
    resultDb.close();
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
function updateSeqStatusSync(status,id) {
    let resultDb = new BetterDB('./db/projectDB.db');
    let stmt = resultDb.prepare(`UPDATE Projects
                SET SequenceStatus = ?
                WHERE ProjectCode = ?`);
    let info = stmt.run(status, id);
    console.log("updateSeqStatusSync Info:", info);
    resultDb.close();
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
                    uid AS uid,
                    public AS public,
                    Description AS description
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
function deleteEnvPeak(projectDir, projectCode) {
    let dbDir = projectDir.substr(0, projectDir.lastIndexOf(".")) + ".db";
    let resultDb = new BetterDB(dbDir);

    let stmt = resultDb.prepare(`DROP TABLE IF EXISTS env_peak;`);
    stmt.run();
    stmt = resultDb.prepare(`DROP TABLE IF EXISTS envelope;`);
    stmt.run();
    resultDb.close();
    updateEnvStatusSync(0, projectCode);
    /*updateEnvStatus(db,0,projectCode, function () {
        callback();
    });*/
}

/**
 * Update proteoform of sequence table by scan
 *
 * @param projectDir
 * @param proteoform
 * @param scan
 */
function updateSeq(projectDir, proteoform, scan) {
    let dbDir = projectDir.substr(0, projectDir.lastIndexOf(".")) + ".db";
    let resultDb = new BetterDB(dbDir);
    let stmt = resultDb.prepare(`UPDATE sequence
                                SET proteoform = ?
                                WHERE scan_id IN (SELECT ID FROM SPECTRA WHERE SCAN = ?);`);
    let info = stmt.run(proteoform, scan);
    console.log("updateSeq info", info.changes);
    resultDb.close();
}
function deleteSeq(projectDir, projectCode) {
    let dbDir = projectDir.substr(0, projectDir.lastIndexOf(".")) + ".db";
    let resultDb = new BetterDB(dbDir);

    let stmt = resultDb.prepare(`DROP TABLE IF EXISTS sequence;`);
    stmt.run();
    resultDb.close();
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
        //console.log(rows);
        let peakList = calcDistrubution.emass(theo_mono_mass,charge,rows);
        if(!peakList) {
            return callback(1);
        }
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
            return callback(0);
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
                WHERE (ProjectStatus = 1 OR ProjectStatus = 0 OR ProjectStatus = 2 OR ProjectStatus = 3) AND uid = ?;`;
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

function removeProject(projectCode) {
    updateProjectStatusSync(3, projectCode);
    getProjectSummary(db, projectCode, function (err, row) {
        let projectDir = row.projectDir;
        let dir = projectDir.substr(0, projectDir.lastIndexOf("/"));
        rimraf(dir, [],function () { console.log("Remove Project " + projectCode); });
    });
}

function updatePublicStatusSync(status, projectCode) {
    const resultDb = new BetterDB('./db/projectDB.db');
    let stmt = resultDb.prepare(`UPDATE Projects
                SET public = ?
                WHERE ProjectCode = ?`);
    let info = stmt.run(status, projectCode);
    console.log('updatePublicStatusSync info', info);
    resultDb.close();
}

function updateDescriptionSync(description, projectCode) {
    const resultDb = new BetterDB('./db/projectDB.db');
    let stmt = resultDb.prepare(`UPDATE Projects
                SET Description = ?
                WHERE ProjectCode = ?`);
    let info = stmt.run(description, projectCode);
    console.log('updateDescriptionSync info', info);
    resultDb.close();
}

function updateProjectNameSync(projectName, projectCode) {
    const resultDb = new BetterDB('./db/projectDB.db');
    let stmt = resultDb.prepare(`UPDATE Projects
                SET ProjectName = ?
                WHERE ProjectCode = ?`);
    let info = stmt.run(projectName, projectCode);
    console.log('updateProjectNameSync info', info);
    resultDb.close();
}

function checkWaitingTasks(db, callback) {
    let sql = `SELECT Tasks.mzmlFile AS mzmlFile, Tasks.envFile AS envFile, Tasks.processEnv AS processEnv, Projects.ProjectName AS projectName, Projects.FileName AS fname, Projects.Email AS email
                FROM Tasks INNER JOIN Projects ON Tasks.projectCode = Projects.ProjectCode
                WHERE Projects.ProjectStatus = 4
                LIMIT 1;`;
    db.get(sql, (err, row) => {
        if (err) {
            throw  err;
        } else {
            return callback(null, row);
        }
    })
}
function insertRow(db, ProjectCode, ProjectName, FileName, Description, ProjectDir, ProjectStatus, Email, EnvStatus, SeqStatus, ms1EnvFile,uid,publicStatus) {
    let sql = 'INSERT INTO Projects(ProjectCode, ProjectName, FileName, Description, ProjectDir, ProjectStatus, Email, EnvelopeStatus, SequenceStatus, MS1_envelope_file, uid, public) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)';
    db.run(sql, [ProjectCode,ProjectName,FileName,Description,ProjectDir,ProjectStatus,Email,EnvStatus,SeqStatus,ms1EnvFile,uid,publicStatus], function(err) {
        if (err) {
            return console.log(err.message);
        }
        // get the last insert id
        console.log(`A row has been inserted with rowid ${this.lastID}`);
    });
}
function insertRowSync(ProjectCode, ProjectName, FileName, Description, ProjectDir, ProjectStatus, Email, EnvStatus, SeqStatus, ms1EnvFile,uid,publicStatus) {
    let resultDb = new BetterDB('./db/projectDB.db');
    let stmt = resultDb.prepare('INSERT INTO Projects(ProjectCode, ProjectName, FileName, Description, ProjectDir, ProjectStatus, Email, EnvelopeStatus, SequenceStatus, MS1_envelope_file, uid, public) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)');
    let info = stmt.run(ProjectCode, ProjectName, FileName, Description, ProjectDir, ProjectStatus, Email, EnvStatus, SeqStatus, ms1EnvFile,uid, publicStatus);
    console.log("insertRowSync info", info);
    resultDb.close();
}
function insertTaskSync(projectCode, app, parameter, threadNum, finish) {
    let resultDb = new BetterDB('./db/projectDB.db');
    let stmt = resultDb.prepare('INSERT INTO Tasks(projectCode, app, parameter, threadNum, finish) VALUES(?,?,?,?,?)');
    let info = stmt.run(projectCode, app, parameter, threadNum, finish);
    console.log("insertTaskSync info", info);
    resultDb.close();
}
function insertTask(db, projectCode, app, parameter, threadNum, finish) {
    let sql = 'INSERT INTO Tasks(projectCode, app, parameter, threadNum, finish) VALUES(?,?,?,?,?)';
    db.run(sql, [projectCode, app, parameter, threadNum, finish], function(err) {
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
var db = new sqlite3.Database('./db/projectDB.db', sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
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
        });

        var sqlToCreateTaskTable = "CREATE TABLE IF NOT EXISTS \"Tasks\" ( `id` INTEGER NOT NULL, `projectCode` TEXT NOT NULL, `app` TEXT NULL, `parameter` TEXT NULL, `threadNum` INTEGER NOT NULL, `finish` INTEGER NOT NULL, PRIMARY KEY(`id`), FOREIGN KEY (projectCode) REFERENCES Projects(ProjectCode))";
        db.run(sqlToCreateTaskTable, function (err) {
            if (err) {
                return console.log(err.message);
            }
            console.log("Table for Tasks is ready!");
            var sqlToTasksIndex = "CREATE INDEX IF NOT EXISTS `tasks_index` ON `Tasks` ( `projectCode` )";
            db.run(sqlToTasksIndex, function (err) {
                if (err) {
                    return console.log(err.message);
                }
                console.log("Index for Tasks is ready!");
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