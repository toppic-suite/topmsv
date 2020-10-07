const nodemailer = require('nodemailer');

/**
 * Class representing a email sender
 */
class EmailSender {
    transport = nodemailer.createTransport({
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
    
    message = {
        from: 'datalink_sender@outlook.com', // Sender address
        to: 'default@gmail.com',         // List of recipients
        subject: 'Default Subject', // Subject line
        text: 'Default text' // Plain text body
    };

    /**
     * Create an email sender
     * @param {string} subject 
     * @param {string} text 
     * @param {string} emailAddress 
     */
    constructor(subject, text, emailAddress) {
        this.message.subject = subject;
        this.message.text = text;
        this.message.to = emailAddress;
    }

    /**
     * Send email to user
     */
    sendEmail() {
        this.transport.sendMail(this.message, function(err, info) {
            if (err) {
                console.log(err)
            } else {
                console.log(info);
            }
        });
    }
}

module.exports = EmailSender;