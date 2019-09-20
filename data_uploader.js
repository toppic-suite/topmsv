// var http = require('http');
// var formidable = require('formidable');
var fs = require('fs');
var nodemailer = require('nodemailer');
const sqlite3 = require('sqlite3').verbose();
// var url = require('url');
var bodyParser = require('body-parser');
var multer  = require('multer');
var express = require('express');
var app = express();

app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(multer({ dest: '/tmp/'}).array('filetoupload'));

app.get('/', function (req, res) {
    res.sendFile( __dirname + "/public/" + "index.html" );
})

app.post('/fileupload', function (req, res) {
    var des_path = __dirname + "/data/"+ req.body.projectname + '/';
    var des_file = __dirname + "/data/"+ req.body.projectname + '/' + req.files[0].originalname;
    var fname = req.files[0].originalname;
    var pname = req.body.projectname;
    var emailadd = req.body.emailaddress;

    // Generate new path for file
    if (!fs.existsSync(des_path)) {
        console.log('The project path does not exist.');
        fs.mkdirSync(des_path);
        console.log('Project path created!')
    }
    // console.log(des_file);
    fs.readFile( req.files[0].path, function (err, data) {
        fs.writeFile(des_file, data, function (err) {
            if( err ){
                console.log( err );
            }else{

                var adr =  'http://localhost:8080/data?id=';
                // output result into screen

                res.write('<h1>File uploaded successfully!</h1>');
                res.write('<h2>Project Name: </h2>');
                res.write(pname);
                res.write('<h2>File Path: </h2>');
                res.write(des_file);

                var id = makeid(11);

                ifExists(db, id, function (err, result) {
                    if(err) {
                        console.log(err);
                    }
                    else {
                        while (true) {
                            console.log(result);
                            if(!result) {
                                insertRow(db, id, fname, des_file);
                                message.text = adr + id;
                                message.subject = pname + ': '+ fname;
                                message.to = emailadd;
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
                    }

                })
                response = {
                    message:'File uploaded successfully',
                    filename:req.files[0].originalname
                };
            }
            console.log( response );
            // res.end( JSON.stringify( response ) );
        });
    });
})

app.get('/data', function(req, res) {
    var id = req.query.id;
    getFilePath(db, id, function (err, result) {
        if (err) {
            console.log(err);
        }
        else {
            console.log(result);
            res.download(result);
            // fs.readFile(result, function(err, data) {
            //     if (err) {
            //         res.writeHead(404, {'Content-Type': 'text/html'});
            //         return res.end("404 Not Found");
            //     }
            //     res.writeHead(200, {'Content-Type': 'text/html'});
            //     res.write(data);
            //     return res.end();
            // });
        }
    });
});

app.get('*', function(req, res){
    // res.status(404).send('what???');
    console.log('404 handler..');
    // res.render('public/404.html', {
    //     status: 404,
    //     title: 'Page not found',
    // });
    res.sendFile( __dirname + "/public/" + "404.html" );
});

var server = app.listen(8080, function () {

    // var host = server.address().address;
    var port = server.address().port;
    console.log("Started on PORT %s", port)

})


function makeid(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}


function getFilePath(db, id, callback) {
    let sql = `SELECT file_path AS path
             FROM files
             WHERE file_id  = ?`;

    db.get(sql, [id], (err, row) => {
            if (err) {
                return callback(err);
            }
            else {
                 return callback(null, row.path);
            }
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
    let sql = `SELECT file_id as id,
                    file_name as name
             FROM files
             WHERE file_id  = ?`;
    let file_id = base64_code;
    // first row only
    db.get(sql, [file_id], (err, row) => {
        if (err) {
            return callback(err);
        }
        else {
            if (row === undefined)
            return callback(null, false);
        }

    });
    // close the database connection
    // db.close();
}

function insertRow(db, base64_code, file_name, file_path) {
    // body...
    // let db = new sqlite3.Database('./db/sample.db');
    let sql = 'INSERT INTO files(file_id, file_name, file_path) VALUES(?,?,?)';
    // insert one row into the langs table
    db.run(sql, [base64_code,file_name,file_path], function(err) {
        if (err) {
            return console.log(err.message);
        }
        // get the last insert id
        console.log(`A row has been inserted with rowid ${this.lastID}`);
    });

    // close the database connection
    // db.close();
}

let db = new sqlite3.Database('./db/fileDB.db', (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to the fileDB.db database.');
});

var transport = nodemailer.createTransport({
    host: "smtp.mailtrap.io",
    port: 2525,
    auth: {
        user: "9540ab1d87da99",
        pass: "133e06c63858da"
    }
});

const message = {
    from: '9f8d9dbe08-22ea50@inbox.mailtrap.io', // Sender address
    to: 'default@email.com',         // List of recipients
    subject: 'Default Subject', // Subject line
    text: 'Default text' // Plain text body
};

// http.createServer(function (req, res) {
//     if (req.url == '/fileupload' && req.method.toLowerCase() == 'post') {
//         var form = new formidable.IncomingForm();
//         form.parse(req, function (err, fields, files) {
//             var oldpath = files.filetoupload.path;
//             var newfile = './data/' + fields.projectname + '/' + files.filetoupload.name;
//             var newpath = './data/' + fields.projectname + '/';
//             let fname = files.filetoupload.name;
//             var pname = fields.projectname;
//             var emailadd = fields.emailaddress;
//
//             if (!fs.existsSync(newpath)) {
//                 console.log('The project path does not exist.');
//                 fs.mkdirSync(newpath);
//                 console.log('Project path created!')
//             }
//
//             fs.rename(oldpath, newfile, function (err) {
//                 if (err) throw err;
//
//                 var adr =  'http://localhost:8080/data?id=';
//
//                 res.write('<h1>File uploaded successfully!</h1>');
//                 res.write('<h2>Project Name: </h2>');
//                 res.write(pname);
//                 res.write('<h2>File Path: </h2>');
//                 res.write(newfile);
//                 let id = makeid(11);
//                 // let db = new sqlite3.Database('./db/fileDB.db');
//                 ifExists(db, id, function (err, result) {
//                     if(err) {
//                         console.log(err);
//                     }
//                     else {
//                         while (true) {
//                             console.log(result);
//                             if(!result) {
//                                 insertRow(db, id, fname, newfile);
//                                 message.text = adr + id;
//                                 message.subject = pname + ': '+ files.filetoupload.name;
//                                 message.to = emailadd;
//                                 transport.sendMail(message, function(err, info) {
//                                     if (err) {
//                                         console.log(err)
//                                     } else {
//                                         console.log(info);
//                                     }
//                                 });
//                                 res.end();
//                                 break;
//                             }
//                         }
//                     }
//
//                 })
//             });
//         });
//
//     } else if (url.parse(req.url, true).pathname =='/data'){
//         let q = url.parse(req.url, true);
//         let id = q.query.id;
//         // console.log(id);
//         getFilePath(db, id, function (err, result) {
//             if (err) {
//                 console.log(err);
//             }
//             else {
//                 console.log(result);
//                 fs.readFile(result, function(err, data) {
//                     if (err) {
//                         res.writeHead(404, {'Content-Type': 'text/html'});
//                         return res.end("404 Not Found");
//                     }
//                     res.writeHead(200, {'Content-Type': 'text/html'});
//                     res.write(data);
//                     return res.end();
//                 });
//             }
//         });
//     } else {
//         res.writeHead(200, {'Content-Type': 'text/html'});
//         res.write('<form action="fileupload" method="post" enctype="multipart/form-data">');
//         res.write('<h1> Data uploader </h1>');
//         res.write('<p>Please type in your project name and choose your data file.</p>');
//
//         res.write('<label id = "projectName">Project Name: </label>');
//         res.write('<input id = "projectName" type="text" name="projectname" required><br>');
//         res.write('<label id = "Email">Email Address: </label>');
//         res.write('<input id = "Email" type="text" name="emailaddress" required><br>');
//         res.write('<label id = "fileName">Data file: </label>');
//         res.write('<input id = "fileName" type="file" name="filetoupload" required><br>');
//
//
//         res.write('<br><input type="submit">');
//         res.write('</form>');
//         return res.end();
//     }
// }).listen(8080);