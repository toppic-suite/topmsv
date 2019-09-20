var fs = require('fs');
var nodemailer = require('nodemailer');
const sqlite3 = require('sqlite3').verbose();
var bodyParser = require('body-parser');
var multer  = require('multer');
var express = require('express');
var app = express();
var upload = multer({ dest: 'tmp/' });
// var url = require('url');
// var http = require('http');
// var formidable = require('formidable');

app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({ extended: false }));
// app.use(multer({ dest: '/tmp/'}).array('filetoupload'));

app.get('/', function (req, res) {
    res.sendFile( __dirname + "/public/" + "index.html" );
})

app.post('/fileupload',upload.single('filetoupload'),  function (req, res, next) {
    // console.log(req.file);
    const file = req.file;
    if (!file) {
        const error = new Error('Please upload a file');
        error.httpStatusCode = 400;
        return next(error)
    }
    var des_path = __dirname + "/data/"+ req.body.projectname + '/';
    var des_file = __dirname + "/data/"+ req.body.projectname + '/' + req.file.originalname;
    var fname = req.file.originalname;
    var pname = req.body.projectname;
    var emailadd = req.body.emailaddress;
    console.log(des_path);
    // Generate new path for file
    if (!fs.existsSync(des_path)) {
        console.log('The project path does not exist.');
        fs.mkdirSync(des_path);
        console.log('Project path created!')
    }
    fs.readFile( req.file.path, function (err, data) {
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
                    filename:req.file.originalname
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
}

let db = new sqlite3.Database('./db/fileDB.db', (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to the fileDB.db database.');
});

// mailtrap for testing
// var transport = nodemailer.createTransport({
//     host: "smtp.mailtrap.io",
//     port: 2525,
//     auth: {
//         user: "9540ab1d87da99",
//         pass: "133e06c63858da"
//     }
// });

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
    to: 'jiangtianze@gmail.com',         // List of recipients
    subject: 'Default Subject', // Subject line
    text: 'Default text' // Plain text body
};

process.on('SIGINT', () => {
    console.log('Close database and server!')
    db.close();
    server.close();
});