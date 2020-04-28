const processFailure = require("./processFailure");
var nodemailer = require('nodemailer');

/**
 * Send failure message to user. Async mode.
 * @param {string} projectName
 * @param {string} projectCode
 * @param {string} email
 * @async
 */
function sendFailureMess(projectName,projectCode,email) {
    setTimeout(function () {
        processFailure(projectCode, function (err) {
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

module.exports = sendFailureMess;