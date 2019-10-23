var fs = require('fs');
var nodemailer = require('nodemailer');
const sqlite3 = require('sqlite3').verbose();
var bodyParser = require('body-parser');
var multer  = require('multer');
var express = require('express');
var app = express();
var upload = multer({ dest: 'tmp/' });
var path = require('path');
const uuidv1 = require('uuid/v1');
// var url = require('url');
// var http = require('http');
var formidable = require('formidable');
const { execFile, execFileSync } = require('child_process');

// set the view engine to ejs
app.set('view engine', 'ejs');

app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({ extended: false }));

app.get('/', function (req, res) {
    res.sendFile( __dirname + "/public/" + "index.html" );
})

app.post('/upload', function (req, res) {
    console.log("hello,upload");
    var form = new formidable.IncomingForm();
    form.encoding = 'utf-8';
    form.uploadDir = "tmp";
    form.keepExtensions = true;
    form.parse(req, function (err, fields, files) {
        //console.log(fields.projectname);
        //console.log(fields.emailaddress);
        //console.log(files.dbfile);
        var projectname = fields.projectname;
        var emailtosend = fields.emailaddress;
        var file = files.dbfile;
        var fname = file.name; // hello.txt
        var folderid = uuidv1();
        var des_path = __dirname + "/data/" + folderid + "/";
        var des_file = __dirname + "/data/" + folderid + "/" + fname;

        // Generate new path for file
        if (!fs.existsSync(des_path)) {
            console.log('The path does not exist.');
            fs.mkdirSync(des_path);
            console.log('Path created: ',des_path);
        }

        fs.rename(file.path, des_file, function (err) {
            if(err) {
                console.log(err);
                return res.send({"error": 403, "message": "Error on saving file!"});
            }
            var adr =  'http://localhost:8080/data?id=';
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
                        insertRow(db, id, projectname, fname,des_file,0, emailtosend);
                        message.text = adr + id;
                        message.subject = projectname + ': '+ fname;
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
            console.log(response);
            res.write(JSON.stringify( response ));

            execFile(__dirname + "/cpp/bin/testreader", [des_file,'-f'], (err, stdout, stderr) => {
                if(err) {
                    console.log(err);
                    return;
                }
                console.log(`stdout: ${stdout}`);
                updateProjectStatus(db, id, function (err) {
                    message.text = adr + id + ' Success: Data has been stored in database!';
                    message.subject = projectname + ': '+ fname + " Success!";
                    message.to = emailtosend;
                    transport.sendMail(message, function(err, info) {
                        if (err) {
                            console.log(err)
                        } else {
                            console.log(info);
                        }
                    });

                })
            });
        });

    })
});

app.get('/data', function(req, res) {
    console.log("Hello data!");
    var projectCode = req.query.id;
    getProjectSummary(db, projectCode, function (err, row) {
        let summary;
        if (err) {
            console.log(err);
        } else {
            summary = {
                ProjectName: row.projectName,
                ProjectStatus: row.projectStatus,
                EmailAddress: row.email
            };
            console.log(summary);
            let projectDir = row.projectDir;
            //res.write(JSON.stringify(summary));
            console.log(row.projectDir);
            getScanRange(projectDir, function (err, row) {
                let scanRange = {
                    MIN: row.minScan,
                    MAX: row.maxScan
                };
                //res.write(JSON.stringify(scanRange));
                res.render('pages/index', {summary, scanRange, projectCode});
            })
            //return res.end();
        }
    });
});
app.get('/peaklist', function(req, res) {
    console.log("Hello, request!");
    var projectCode = req.query.projectCode;
    var scanID = req.query.scanID;
    getProjectSummary(db, projectCode, function (err, row) {
        let projectDir = row.projectDir;
        getPeakList(projectDir, scanID, function (err, rows) {
            console.log(typeof rows);
            res.write(JSON.stringify(rows));
            res.end();
        })
    })
});
// app.use( function(req, res){
//     console.log('404 handler..');
//     res.sendFile( __dirname + "/public/" + "404.html" );
// });

var server = app.listen(8080, function () {

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
function updateProjectStatus(db, id,callback) {
    let sql = `UPDATE Projects
                SET ProjectStatus = 1
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
                    ProjectDir AS projectDir
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
function getScanRange(dir, callback) {
    let sql = `SELECT MIN(SCAN) AS minScan, MAX(SCAN) AS maxScan
                FROM SPECTRA`;
    let dbDir = dir.substr(0, dir.lastIndexOf(".")) + ".db";
    let resultDb = new sqlite3.Database(dbDir, (err) => {
        if (err) {
            console.error(err.message);
        }
        console.log('Connected to the result database.');
    });
    resultDb.get(sql, (err, row) => {
        if (err) {
            console.error(err.message);
        }
        //console.log(row);
        return callback(null, row);
    });
}
function getPeakList(dir, scanID, callback) {
    let sql = `SELECT MZ AS mz,
                  INTENSITY AS intensity
           FROM PEAKS INNER JOIN SPECTRA ON PEAKS.SPECTRAID=SPECTRA.ID
           WHERE SCAN = ?`;
    let dbDir = dir.substr(0, dir.lastIndexOf(".")) + ".db";
    let resultDb = new sqlite3.Database(dbDir, (err) => {
        if (err) {
            console.error(err.message);
        }
        console.log('Connected to the result database.');
    });
    resultDb.all(sql, [scanID], (err, rows) => {
        if (err) {
            throw err;
        }
        return callback(null, rows);
        //console.log(`${row.MZ} - ${row.INTENSITY}`);
        // var data = JSON.stringify(rows);
        // fs.writeFileSync('result.json', data);
    });
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

function insertRow(db, ProjectCode, ProjectName, FileName, ProjectDir, ProjectStatus, Email) {
    let sql = 'INSERT INTO Projects(ProjectCode, ProjectName, FileName, ProjectDir, ProjectStatus, Email) VALUES(?,?,?,?,?,?)';
    db.run(sql, [ProjectCode,ProjectName,FileName,ProjectDir,ProjectStatus,Email], function(err) {
        if (err) {
            return console.log(err.message);
        }
        // get the last insert id
        console.log(`A row has been inserted with rowid ${this.lastID}`);
    });
}

let db = new sqlite3.Database('./db/projectDB.db', (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to the projectDB.db database.');
});

/*mailtrap for testing
var transport = nodemailer.createTransport({
    host: "smtp.mailtrap.io",
    port: 2525,
    auth: {
        user: "9540ab1d87da99",
        pass: "133e06c63858da"
    }
});*/

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
    console.log('Close database and server!')
    db.close();
    server.close();
});