const nodemailer = require('nodemailer');
const nodemailerAuth = require('./nodemailer-auth');
const EmailSender = require('./library/email_sender');
const favicon = require('serve-favicon');
const betterDB = require('better-sqlite3');
const bodyParser = require('body-parser');
const compression = require('compression');
const helmet = require('helmet');
const express = require('express');
const cookieParser = require('cookie-parser');
const cookieSession = require('cookie-session');
const passport = require('passport');
const auth = require('./auth');
const skipAuth = require('./skipAuth');
const os = require('os');
const cpuCount = os.cpus().length;
const app = express();
const fs = require('fs');

const path = require('path');
const ChromeLauncher = require('chrome-launcher');

let shouldAuthenticate = true;
let shouldSendEmail = true;

console.log("Loading.... please wait until server is ready\n")


app.use(helmet());
app.use(cookieSession({
    name:'session',
    keys:['4324']
}));
app.use(cookieParser());

//skip authentication based on config setting
if (fs.existsSync('config.json')) {
    let configData = fs.readFileSync('config.json');
    configData = JSON.parse(configData);
    if (!configData.authentication) {
        shouldAuthenticate = false;
    }
    if (!configData.sendEmail) {
        shouldSendEmail = false;
    }
}

if (shouldAuthenticate) {
    auth(passport);
    app.use(passport.initialize());    
}
else{
    skipAuth(passport);
    app.use(passport.initialize());    
}
const CronJob = require('cron').CronJob;

/**
 * Create a CronJob to check expired projects every day midnight, if expired then remove projects
 *
 * @async
 * @type {CronJob}
 */
const checkExpiredProj = require('./library/checkExpiredProj');
const checkNearExpiredProj = require('./library/checkNearExpiredProj');
const deleteProject = require('./library/deleteProject');

const job = new CronJob('00 00 00 * * *', function() {
    const d = new Date();
    console.log('Check expired projects:', d);
    checkExpiredProj(function (err, rows) {
        rows.forEach(element => {
            deleteProject(element.pcode);
        });
    });
    if (shouldSendEmail) {
        checkNearExpiredProj(function (err, rows) {
            rows.forEach(element => {
                nodemailerAuth.message.subject = "Your data is about to expire!";
                nodemailerAuth.message.to = element.email;
                nodemailerAuth.message.html = '<p>Project Name: ' + element.projectName + '<br/>File Name: ' + element.fileName + '<br/>To secure storage space, data is deleted 30 days after upload. Your project is going to be removed from our database in 1 day.</p><p>If you would like to keep your data for another 30 days, click <a href="https://toppic.soic.iupui.edu/updateDate?pcode=' + element.pcode + '">here</a>.</p>';
    
                nodemailerAuth.transport.sendMail(nodemailerAuth.message, function(err, info) {
                    if (err) {
                        console.log(err)
                    } else {
                        console.log(info);
                    }
                });
            });
        });
    }
});
job.start();

/**
 * Show available resourses based on cpu counts
 */
let avaiResourse = cpuCount - 2;
// console.log("The number of CPU cores:", cpuCount);

/**
 * Create a task scheduler for topview server
 * It will check Tasks table in project database every second, if taskList is not empty then check
 * whether it has enough resources, if there are available resources then execute tasks, if not then check again
 * next second.
 *
 * @type {CronJob}
 */
const { execFile, exec } = require('child_process');
const getTaskListSync = require("./library/getTaskListSync");
const checkProjectStatusSync = require("./library/checkProjectStatusSync");
const updateProjectStatusSync = require("./library/updateProjectStatusSync");
const updateTaskStatusSync = require("./library/updateTaskStatusSync");
const processFailure = require("./library/processFailure");
const checkRemainingTask = require("./library/checkRemainingTask");
const { config } = require('process');

const checkWaitTasks = new CronJob("* * * * * *", function() {
    // console.log("Check waiting tasks in database");
    let tasksList = getTaskListSync();
    // console.log("tasksList", tasksList);
    if (tasksList !== undefined) {
        for (let i = 0; i < tasksList.length; i++) {
            let task = tasksList[i];
            let threadNum = task.threadNum;
            let projectCode = task.projectCode;
            let logFileName = projectCode + "_" + task.taskID + "_log.txt"; //task log file name
            let logPath = path.join("log", logFileName);

            if(threadNum <= avaiResourse) {
                // console.log("Available resources");
                let projectStatus = checkProjectStatusSync(projectCode).projectStatus;
                console.log("projectStatus", projectStatus, ", projectCode", projectCode);
                if (projectStatus === 0) {
                    console.log("This project is processing, skip it");
                    return;
                } else if (projectStatus === 2 || projectStatus ===3) {
                    console.log("This project is removed or failed, skip it");
                    return;
                }else {
                    console.log("Processing project...");
                    fs.appendFileSync(logPath, "Processing task....\n");

                    let taskID = task.taskID;
                    let app = task.app;
                    let parameter = task.parameter;
                    let projectname = task.projectName;
                    let fname = task.fname;
                    let emailtosend = task.email;
                    let adr =  'https://toppic.soic.iupui.edu/data?id=';

                    if(app === 'email') {
                        let subject = "Your TopMSV task is done";
                        let text = "Project Name: " + projectname + "\nFile Name: " + fname + "\nLink: " + adr + projectCode + '\nStatus: Done';
                        let emailAddress = emailtosend;
                        let email_sender = new EmailSender(subject, text, emailAddress);

                        if (shouldSendEmail) {
                            email_sender.sendEmail();
                        }else{
                            console.log("SUCCESS: task has completed");
                        }

                    } else {
                        avaiResourse = avaiResourse - threadNum;
                        updateProjectStatusSync(0, projectCode);
                        exec(app+' '+parameter, {maxBuffer: 1024 * 5000000}, (err, stdout, stderr) => {
                            // console.log(stdout);
                            console.log(stderr);
                            if(err) {
                                fs.appendFileSync(logPath, "[Error] Task failed! Please try again.\n");
                                console.log(err);
                                updateTaskStatusSync(1, taskID);
                                avaiResourse = avaiResourse + threadNum;
                                setTimeout(function () {
                                    processFailure(projectCode, function (err) {
                                        console.log("Process failed!");
                                        if (shouldSendEmail) {
                                            nodemailerAuth.message.text = "Project Name: " + projectname + "\nFile Name: " + fname + '\nProject Status: Cannot process your dataset, please check your data.';
                                            nodemailerAuth.message.subject = "Your data processing failed";
                                            nodemailerAuth.message.to = emailtosend;    
                                            nodemailerAuth.transport.sendMail(nodemailerAuth.message, function(err, info) {
                                                if (err) {
                                                    console.log(err)
                                                } else {
                                                    console.log(info);
                                                }
                                            });
                                        }
                                    });
                                }, 60000);
                            }else{
                                updateTaskStatusSync(1, taskID);
                                avaiResourse = avaiResourse + threadNum;

                                fs.appendFileSync(logPath, "[Success] Task is finished. Click the project link to view results.\n");

								let remainingTask = checkRemainingTask(projectCode);
                                if (remainingTask === 1) {
                                    //fs.appendFileSync(logPath, "Task is waiting to run....\n");
                                    //fs.appendFileSync(logPath, "Project status is " + projectStatus + "\n");
                                    updateProjectStatusSync(4, projectCode); // Update project status to 4 (waiting)
                                } else {
                                    updateProjectStatusSync(1,projectCode); // Update project status to 1 (Success)
                                    if (shouldSendEmail) {
                                        nodemailerAuth.message.text = "Project Name: " + projectname + "\nFile Name: " + fname + "\nLink: " + adr + projectCode + '\nStatus: Done';
                                        nodemailerAuth.message.subject = "Your task is done";
                                        nodemailerAuth.message.to = emailtosend;    
                                        nodemailerAuth.transport.sendMail(nodemailerAuth.message, function(err, info) {
                                            if (err) {
                                                console.log(err)
                                            } else {
                                                console.log(info);
                                            }
                                        });    
                                    }else{
                                        console.log("SUCCESS: task has completed");
                                    }
                                }

                                /*fs.appendFileSync(logPath, "[Success] Task is finished. Click the project link to view results.\n");
                                updateProjectStatusSync(1,projectCode); // Update project status to 1 (Success)
                                nodemailerAuth.message.text = "Project Name: " + projectname + "\nFile Name: " + fname + "\nLink: " + adr + projectCode + '\nStatus: Done';
                                nodemailerAuth.message.subject = "Your task is done";
                                nodemailerAuth.message.to = emailtosend;
                                if (shouldSendEmail) {
                                    nodemailerAuth.transport.sendMail(nodemailerAuth.message, function(err, info) {
                                        if (err) {
                                            console.log(err)
                                        } else {
                                            console.log(info);
                                        }
                                    });    
                                }else{
                                    console.log("SUCCESS: task has completed");

                                }*/
                            }
                        });    
                    }
                }
            } else {
                console.log("No enough resources!");
                return;
            }
        }
    }
});
checkWaitTasks.start();

// set the view engine to ejs
app.set('view engine', 'ejs');
app.use(compression());

// set favicon using express middleware
app.use(favicon(__dirname + '/public/image/favicon.ico'));

app.use(bodyParser.urlencoded({ extended: false }));

// set express static directory
app.use(express.static(__dirname + '/public'));

// Express routers start from here

/**
 * Express router for main webpage
 *
 * Show all public projects in database to both guests and users
 */
app.use('/', require("./router/index"));

/**
 * Express router for /submit
 * send submit.html page to user
 */
app.use('/', require("./router/submit"));

/**
 * Express router for /logout
 *
 * clear session and redirect to home page
 */
app.use('/', require('./router/logout'));

/**
 * Express router for /upload
 *
 * Save mzML file and env file (optional) to target directory
 * and save project information into project database,
 * then submit task to task scheduler
 */
app.use('/', require("./router/upload"));
app.use('/', require("./router/uploadMultiple"));

/**
 * Express router for /data
 *
 * Check project status and render result page back to users
 */
app.use('/', require("./router/data"));

/**
 * Express router for /sequence
 *
 * Handle request to upload sequence file, delete current sequence information in database
 * then submit task to process sequence file
 */
app.use('/', require("./router/sequence"));

/**
 * Express router for /seqQuery
 *
 * Query proteoform by projectCode and scan,
 * send back proteoform result to user
 */
app.use('/', require("./router/seqQuery"));

/**
 * Express router for /updateSeq
 *
 * Handle request to update one proteoform in database by scan
 */
app.use('/', require("./router/updateSeq"));

/**
 * Express router for /mzrt
 *
 * Handle request to upload mzrt file, save files to project directory,
 * then delete current feature and submit process mzrt file task to
 * task scheduler
 */
app.use('/', require("./router/mzrt"));

/**
 * Express router for /msalign
 *
 * Handle request to upload msalign file, save files to project directory,
 * then delete current envelope peaks and submit process msalign file task to
 * task scheduler
 */
app.use('/', require("./router/msalign"));

/**
 * Express router for /auth/google/callback
 *
 * authenticate users by google, if there is a new user, then insert user information into Users table of database
 */
app.use('/', require("./router/auth_google_callback"));

/**
 * Express router for /seqResults
 *
 * Query proteoform list by projectCode and
 * render a sequence list web page to users
 */
app.use('/', require("./router/seqResults"));

/**
 * Express router for /projects
 *
 * Authenticate user by uid then
 * get a list which contains all projects the user owns and render the list back to user
 */
app.use('/', require("./router/projects"));

/**
 * Express router for /tasks
 *
 * Authenticate user by uid then
 * get a list which contains all tasks the user owns and render the list back to user
 */
 app.use('/', require("./router/tasks"));

/**
 * Express router for /toppic
 *
 * Render a toppic task configure web page back to user
 */
app.use('/', require("./router/toppic"));

/**
 * Express router for /toppicTask
 *
 * Hanld request to generate a toppic task, save files and delete previous sequence information in database
 */
app.use('/', require("./router/toppicTask"));

/**
 * Express router for /topfd
 *
 * Render topfd configure page to user
 */
app.use('/', require("./router/topfd"));

/**
 * Express router for /topfdTask
 *
 * Handle request to create a topFD task, generate parameter for task and delete previous envelope peaks
 */
app.use('/', require("./router/topfdTask"));

/**
 * Express router for /projectManagement
 *
 * Render project management page to user
 */
app.use('/', require("./router/projectManagement"));

/**
 * Express router for /removeProject
 *
 * Remove project by projectCode
 */
app.use('/', require("./router/removeProject"));

/**
 * Express router for /editProject
 *
 * Edit projectName, projectDescription, projectPublicStatus by projectCode
 */
app.use('/', require("./router/editProject"));

/**
 * Express router for /deleteMsalign
 *
 * Delete current envelope peaks
 */
app.use('/', require("./router/deleteMsalign"));
/**
 * Express router for /deleteMzrt
 *
 * Delete current feature information
 */
app.use('/', require("./router/deleteMzrt"));

/**
 * Express router for /deleteSeq
 *
 * Delete current sequence information
 */
app.use('/', require("./router/deleteSeq"));

/**
 * Express router for /download
 *
 * If envStatus is 0, then render mzML file to user.
 * IF envStatus is 1, then zip all results files then render zip back to user.
 */
app.use('/', require("./router/download"));

/**
 * Express router for /deleterow
 *
 * Delete multiple envelopes by envelope_id
 */
app.use('/', require("./router/deleterow"));

/**
 * Express router for /addrow
 *
 * Add one envelope and calculate its distribution then save it in existing database
 */
app.use('/', require("./router/addrow"));

app.use('/', require("./router/editrow"));

app.use('/', require("./router/previewEdit"));

app.use('/', require("./router/peaklist"));

app.use('/', require("./router/scanID"));

app.use('/', require("./router/prev"));

app.use('/', require("./router/next"));

app.use('/', require("./router/scanlevel"));

app.use('/', require("./router/relatedScan1"));

app.use('/', require("./router/relatedScan2"));

app.use('/', require("./router/precMZ"));

app.use('/',require("./router/scanTwoList"));

app.use('/', require("./router/getInteSumList"));

app.use('/', require("./router/getRT"));

app.use('/', require("./router/findNextLevelOneScan"));

app.use('/', require("./router/envlist"));

app.use('/', require("./router/envtable"));

/*routers used for 3d visualization */
app.use('/', require("./router/load3dDataByRT"));
app.use('/', require("./router/load3dDataByParaRange"));
app.use('/', require("./router/getPeaksPerTable"));
app.use('/', require("./router/getMax"));
/*routers used for 3d visualization -- feature annotation*/
app.use('/', require("./router/loadMzrtData"));

app.use('/', require("./router/projectTab"));

app.use('/', require("./router/newProject"));

app.use('/', require("./router/createProject"));

app.use('/', require("./router/experimentManagement"));

app.use('/', require("./router/createExperiment"));

app.use('/', require("./router/test"));

app.use('/',require("./router/getInfo"));

app.use('/', require("./router/newExperiment"));

app.use('/', require("./router/createDataset"));

app.use('/', require("./router/getExperimentList"));

app.use('/', require("./router/newDataset"));

app.use('/', require("./router/deleteRequest"));

app.use('/', require("./router/editRequest"));

app.use('/', require("./router/editManage"));

app.use('/', require("./router/projectview"));

app.use('/', require("./router/ptmQuery"));

app.use('/', require('./router/getAllowToppicStatus'));

app.use('/', require("./router/updateDate"));

app.use('/', require("./router/getStatusLog"));

/**router for 3D graph */
app.use('/', require("./router/getMax"));
app.use('/', require("./router/load3dDataByParaRange"));
app.use('/', require("./router/loadMzrtData"));
app.use('/', require("./router/mzrt"));
app.use('/', require("./router/deleteMzrt"));
app.use('/', require("./router/getExpectedPeakNum"));

app.use('/', require("./router/auth_google"));
app.use('/', require("./router/auth_skip"));

// 404 router
app.use('/*', function(req, res){
    console.log('404 handler..');
    res.sendFile( __dirname + "/public/" + "404.html" );
});

/**
 * Create server database during server startup. Better-sqlite version. Sync mode.
 */
const projectDB = new betterDB('./db/projectDB.db');
const sqlToCreateTable = projectDB.prepare("CREATE TABLE IF NOT EXISTS \"Projects\" ( `ProjectID` INTEGER NOT NULL, `ProjectCode` TEXT NOT NULL UNIQUE, `ProjectName` TEXT NOT NULL, `FileName` TEXT NOT NULL, `Description` TEXT NULL, `ProjectDir` TEXT NOT NULL, `ProjectStatus` INTEGER NOT NULL, `Email` TEXT NOT NULL, `Date` TEXT DEFAULT CURRENT_TIMESTAMP, 'EnvelopeStatus' INTEGER NOT NULL, 'FeatureStatus' INTEGER NOT NULL, 'SequenceStatus' INTEGER NOT NULL, 'MS1_envelope_file' TEXT NULL, 'uid' TEXT NULL, 'public' INTEGER NOT NULL , 'doesExpire' TEXT NOT NULL, 'allowToppic' INTEGER NOT NULL, PRIMARY KEY(`ProjectID`))");
sqlToCreateTable.run();
const sqlToCreateIndex = projectDB.prepare("CREATE INDEX IF NOT EXISTS `project_index` ON `Projects` ( `ProjectCode` )");
sqlToCreateIndex.run();
const sqlToUserTable = projectDB.prepare("CREATE TABLE IF NOT EXISTS \"Users\" ( `uid` TEXT NOT NULL, `email` TEXT NULL, `firstname` TEXT NULL, `lastname` TEXT NULL, `fullname` TEXT NULL, PRIMARY KEY(`uid`) )");
sqlToUserTable.run();
const sqlToUserIndex = projectDB.prepare("CREATE INDEX IF NOT EXISTS `users_index` ON `users` ( `email` )");
sqlToUserIndex.run();
const sqlToCreateTaskTable = projectDB.prepare("CREATE TABLE IF NOT EXISTS \"Tasks\" ( `id` INTEGER NOT NULL, `projectCode` TEXT NOT NULL, `app` TEXT NULL, `parameter` TEXT NULL, `threadNum` INTEGER NOT NULL, `finish` INTEGER NOT NULL, `Date` TEXT DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY(`id`), FOREIGN KEY (projectCode) REFERENCES Projects(ProjectCode))");
sqlToCreateTaskTable.run();
const sqlToTasksIndex = projectDB.prepare("CREATE INDEX IF NOT EXISTS `tasks_index` ON `Tasks` ( `projectCode` )");
sqlToTasksIndex.run();
projectDB.close();

console.log("Server database is Ready!");

const server = app.listen(8443, function () {
    const port = server.address().port;
    console.log("Server started on PORT %s", port);

    ChromeLauncher.launch({
        startingUrl: 'http://localhost:8443/',
        ignoreDefaultFlags: true
    }).then(chrome => {
		console.log()
	}).catch(err => {
		console.log(err);
	})
	;
});
process.title = "TopMSV";

process.on('SIGINT', () => {
    server.close(()=> {
        console.log('Server closed!');
        process.exit(0);
    });
});