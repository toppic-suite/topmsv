const nodemailer = require('nodemailer');

const transport = nodemailer.createTransport({
    host: "smtp.office365.com", // hostname
    secureConnection: false, // TLS requires secureConnection to be false
    port: 587, // port for secure SMTP
    tls: {
        ciphers:'SSLv3'
    },
    auth: {
        user: 'topmsv01@outlook.com',
        pass: 'iupuiSOIC'
    }
});

const message = {
    from: 'topmsv01@outlook.com',
    to: 'default@gmail.com',         // List of recipients
    subject: 'Default Subject', // Subject line
    text: 'Default text' // Plain text body
};

module.exports.transport = transport;
module.exports.message = message;