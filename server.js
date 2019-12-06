var fs = require('fs');
var nodemailer = require('nodemailer');
const sqlite3 = require('sqlite3').verbose();
var bodyParser = require('body-parser');
//var multer  = require('multer');
var express = require('express');
var app = express();
//var upload = multer({ dest: 'tmp/' });
//var path = require('path');
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
            var adr =  'http://149.166.112.7:8080/data?id=';
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
            console.log(response);
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
                console.log(`stdout: ${stdout}`);
                updateProjectStatus(db, id, function (err) {
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
            // console.log(row.projectStatus);
            if(row === undefined) {
                res.send("No such project, please check your link.");
                res.end;
            } else {
                // console.log(row);
                if (row.projectStatus === 1) {
                    summary = {
                        ProjectName: row.projectName,
                        ProjectStatus: row.projectStatus,
                        EmailAddress: row.email
                    };
                    //console.log(summary);
                    let projectDir = row.projectDir;
                    var fileName = row.fileName;
                    //res.write(JSON.stringify(summary));
                    //console.log(row.projectDir);
                    getScanRange(projectDir, function (err, row) {
                        let scanRange = {
                            MIN: row.minScan,
                            MAX: row.maxScan
                        };
                        //res.write(JSON.stringify(scanRange));
                        //console.log(projectDir);
                        res.render('pages/index', {
                            summary,
                            scanRange,
                            projectCode,
                            projectDir,
                            fileName
                        });
                    })
                } else if (row.projectStatus === 0) {
                    console.log("Project status: 0");
                    res.send("Your project is processing, please wait for result.");
                    res.end;
                } else {
                    console.log("Project status: 2");
                    res.send("Your project failed. Please check your data.");
                    res.end;
                }
            }
        }
    });
});
app.get('/peaklist', function(req, res) {
    console.log("Hello, peaklist!");
    //var projectCode = req.query.projectCode;
    var projectDir = req.query.projectDir;
    var scanID = req.query.scanID;
    getPeakList(projectDir, scanID, function (err, rows) {
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
                    FileName AS fileName
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

function getPeakList(dir, scanID, callback) {
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
    resultDb.all(sql, [scanID], (err, rows) => {
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
};

let db = new sqlite3.Database('./db/projectDB.db', sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to the projectDB.db database.');
    var sqlToCreateTable = "CREATE TABLE IF NOT EXISTS \"Projects\" ( `ProjectID` INTEGER NOT NULL, `ProjectCode` TEXT NOT NULL UNIQUE, `ProjectName` TEXT NOT NULL, `FileName` TEXT NOT NULL, `ProjectDir` TEXT NOT NULL, `ProjectStatus` INTEGER NOT NULL, `Email` TEXT NOT NULL, PRIMARY KEY(`ProjectID`) )";
    db.run(sqlToCreateTable, function (err) {
        if (err) {
            return console.log(err.message);
        }
        console.log("Table for project is ready!");
        var sqlToCreateIndex = "CREATE INDEX IF NOT EXISTS `project_index` ON `Projects` ( `ProjectID`, `ProjectCode` )";
        db.run(sqlToCreateIndex, function (err) {
            if (err) {
                return console.log(err.message);
            }
            console.log("Index for project is ready!");
        })
    });
});

/*let testDb = new sqlite3.Database('./data/8ad65410-ffe0-11e9-bc47-83c5c03c7280/CPTAC_Intact_rep3_15Jan15_Bane_C2-14-08-02RZ_7000-7300.db', (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to the testDB.db database.');
});*/

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