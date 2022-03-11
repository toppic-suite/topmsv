"use strict";
const processFailure = require("./processFailure");
var nodemailer = require('nodemailer');
var nodemailerAuth = require('../library/auth/nodemailer-auth');
/**
 * Send failure message to user. Async mode.
 * @param {string} projectName - Project name
 * @param {string} projectCode - Project code
 * @param {string} email - User email address
 * @async
 */
function sendFailureMess(projectName, projectCode, email) {
    setTimeout(function () {
        processFailure(projectCode, function (err) {
            console.log("Process failed!");
            nodemailerAuth.message.text = "Project Name: " + projectName + '\nProject Status: Cannot process your dataset, please check your data.';
            nodemailerAuth.message.subject = "Your data processing failed";
            nodemailerAuth.message.to = email;
            nodemailerAuth.transport.sendMail(nodemailerAuth.message, function (err, info) {
                if (err) {
                    console.log(err);
                }
                else {
                    console.log(info);
                }
            });
        });
    }, 60000);
}
module.exports = sendFailureMess;
