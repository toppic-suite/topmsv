var fs = require('fs');
var nodemailer = require('nodemailer');
var favicon = require('serve-favicon');
const sqlite3 = require('sqlite3').verbose();
var bodyParser = require('body-parser');
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
const { execFile, exec } = require('child_process');
const CronJob = require('cron').CronJob;

// Check expired projects every day midnight
const checkExpiredProj = require('./library/checkExpiredProj');
const deleteProject = require('./library/deleteProject');
/**
 * Create a CronJob to check expired projects every day midnight, if expired then remove projects
 *
 * @async
 * @type {CronJob}
 */
const job = new CronJob('00 00 00 * * *', function() {
    const d = new Date();
    console.log('Check expired projects:', d);
    checkExpiredProj(function (err, rows) {
        rows.forEach(element => {
            deleteProject(element.pcode);
        });
    });
});
job.start();

var avaiResourse = cpuCount - 2;
console.log("cpuCount", cpuCount);

const getTaskListSync = require('./library/getTaskListSync');
/**
 * Create a task scheduler for topview app
 * It will check Tasks table in project database every second, if taskList is not empty then check
 * whether it has enough resources, if there are available resources then execute tasks, if not then check again
 * next second.
 *
 * @type {CronJob}
 */
const checkProjectStatusSync = require("./library/checkProjectStatusSync");
const updateProjectStatusSync = require("./library/updateProjectStatusSync");
const updateTaskStatusSync = require("./library/updateTaskStatusSync");
const processFailure = require("./library/processFailure");
const checkRemainingTask = require("./library/checkRemainingTask");

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
                                processFailure(projectCode, function (err) {
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
                            }
                        }
                    });
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

/**
 * Express router for main webpage
 *
 * Show all public projects in database to both guests and users
 */
app.use('/', require("./router/index"));

app.use(express.static(__dirname + '/public'));

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
const insertUser = require('./library/insertUser');
app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/' }),
    function(req, res) {
        //console.log('req.user.token',req.user.profile);
        let profile = req.user.profile;
        req.session.token = req.user.token;
        insertUser(profile.id, profile.emails[0].value,profile.name.givenName, profile.name.familyName, profile.displayName);
        res.redirect('/');
    }
);

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

app.use('/', require("./router/peaklist"))


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
        insertUser(uid, email, firstName, lastName, fullName);
        callback(uid);
        // If request specified a G Suite domain:
        //const domain = payload['hd'];
    }
    verify().catch(console.error);
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