"use strict";
const nodemailer = require('nodemailer');
const nodemailerAuth = require('../library/auth/nodemailer-auth');
/**
 * Class representing a email sender
 */
class EmailSender {
    /**
     * Create an email sender
     * @param {string} subject
     * @param {string} text
     * @param {string} emailAddress
     */
    constructor(subject, text, emailAddress) {
        this.transport = nodemailerAuth.transport; //nodemailer-auth.js    
        this.message = nodemailerAuth.message;
        this.message.subject = subject;
        this.message.text = text;
        this.message.to = emailAddress;
    }
    /**
     * Send email to user
     */
    sendEmail() {
        this.transport.sendMail(this.message, function (err, info) {
            if (err) {
                console.log(err);
            }
            else {
                console.log(info);
            }
        });
    }
}
module.exports = EmailSender;
