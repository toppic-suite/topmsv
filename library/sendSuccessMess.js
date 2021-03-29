const updateProjectStatus = require("./updateProjectStatus");
const updateEnvStatus = require("./updateEnvStatus");
var nodemailer = require('nodemailer');
var nodemailerAuth = require('../nodemailer-auth');
/**
 * Send success message to user. Async mode.
 * @param {string} projectName - Project name
 * @param {string} projectCode - Project code
 * @param {string} email - User email address
 * @async
 */
function sendSuccessMess(projectName,projectCode,email) {
    updateProjectStatus(1, projectCode, function (err) {
        updateEnvStatus(1, projectCode, function (err) {
            nodemailerAuth.message.text = "Project Name: " + projectName + '\nStatus: Done' + '\nPlease go to project center to check your result.';
            nodemailerAuth.message.subject = "Your data processing is done";
            nodemailerAuth.message.to = email;
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

module.exports = sendSuccessMess;