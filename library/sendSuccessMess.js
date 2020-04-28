const updateProjectStatus = require("./updateProjectStatus");
const updateEnvStatus = require("./updateEnvStatus");
var nodemailer = require('nodemailer');
/**
 * Send success message to user. Async mode.
 * @param {string} projectName
 * @param {string} projectCode
 * @param {string} email
 * @async
 */
function sendSuccessMess(projectName,projectCode,email) {
    updateProjectStatus(1, projectCode, function (err) {
        updateEnvStatus(1, projectCode, function (err) {
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
module.exports = sendSuccessMess;