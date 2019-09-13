var http = require('http');
var formidable = require('formidable');
var fs = require('fs');
var nodemailer = require('nodemailer');


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
            var newfile = './' + fields.projectname + '/' + files.filetoupload.name;
            var newpath = './' + fields.projectname + '/';
            var pname = fields.projectname;
            var emailadd = fields.emailaddress;

            if (!fs.existsSync(newpath)) {
                console.log('The project path does not exist.');
                fs.mkdirSync(newpath);
                console.log('Project path created!')
            }

            fs.rename(oldpath, newfile, function (err) {
                if (err) throw err;
                res.write('<h1>File uploaded successfully!</h1>');
                res.write('<h2>Project Name: </h2>');
                res.write(pname);
                res.write('<h2>File Path: </h2>');
                res.write(newfile);
                // res.end(util.inspect({fields: fields, files: files}));
                message.subject = pname + ': '+ files.filetoupload.name;
                message.text = newfile;
                message.to = emailadd;
                transport.sendMail(message, function(err, info) {
                    if (err) {
                        console.log(err)
                    } else {
                        console.log(info);
                    }
                });
                res.end();
            });
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