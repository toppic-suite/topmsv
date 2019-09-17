var http = require('http');
var formidable = require('formidable');
var fs = require('fs');
var nodemailer = require('nodemailer');
const sqlite3 = require('sqlite3').verbose();
var url = require('url');

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

http.createServer(function (req, res) {
    if (req.url == '/fileupload' && req.method.toLowerCase() == 'post') {
        var form = new formidable.IncomingForm();
        form.parse(req, function (err, fields, files) {
            var oldpath = files.filetoupload.path;
            var newfile = './data/' + fields.projectname + '/' + files.filetoupload.name;
            var newpath = './data/' + fields.projectname + '/';
            let fname = files.filetoupload.name;
            var pname = fields.projectname;
            var emailadd = fields.emailaddress;

            if (!fs.existsSync(newpath)) {
                console.log('The project path does not exist.');
                fs.mkdirSync(newpath);
                console.log('Project path created!')
            }

            fs.rename(oldpath, newfile, function (err) {
                if (err) throw err;

                var adr =  'http://localhost:8080/data?id=';

                res.write('<h1>File uploaded successfully!</h1>');
                res.write('<h2>Project Name: </h2>');
                res.write(pname);
                res.write('<h2>File Path: </h2>');
                res.write(newfile);
                let id = makeid(11);
                // let db = new sqlite3.Database('./db/fileDB.db');
                ifExists(db, id, function (err, result) {
                    if(err) {
                        console.log(err);
                    }
                    else {
                        while (true) {
                            console.log(result);
                            if(!result) {
                                insertRow(db, id, fname, newfile);
                                message.text = adr + id;
                                message.subject = pname + ': '+ files.filetoupload.name;
                                message.to = emailadd;
                                transport.sendMail(message, function(err, info) {
                                    if (err) {
                                        console.log(err)
                                    } else {
                                        console.log(info);
                                    }
                                });
                                res.end();
                                break;
                            }
                        }
                    }

                })
            });
        });

    } else if (url.parse(req.url, true).pathname =='/data'){
        let q = url.parse(req.url, true);
        let id = q.query.id;
        // console.log(id);
        getFilePath(db, id, function (err, result) {
            if (err) {
                console.log(err);
            }
            else {
                console.log(result);
                fs.readFile(result, function(err, data) {
                    if (err) {
                        res.writeHead(404, {'Content-Type': 'text/html'});
                        return res.end("404 Not Found");
                    }
                    res.writeHead(200, {'Content-Type': 'text/html'});
                    res.write(data);
                    return res.end();
                });
            }
        });
    } else {
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.write('<form action="fileupload" method="post" enctype="multipart/form-data">');
        res.write('<h1> Data uploader </h1>');
        res.write('<p>Please type in your project name and choose your data file.</p>');

        res.write('<label id = "projectName">Project Name: </label>');
        res.write('<input id = "projectName" type="text" name="projectname" required><br>');
        res.write('<label id = "Email">Email Address: </label>');
        res.write('<input id = "Email" type="text" name="emailaddress" required><br>');
        res.write('<label id = "fileName">Data file: </label>');
        res.write('<input id = "fileName" type="file" name="filetoupload" required><br>');


        res.write('<br><input type="submit">');
        res.write('</form>');
        return res.end();
    }
}).listen(8080);