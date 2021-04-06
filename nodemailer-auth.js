const nodemailer = require('nodemailer');

const transport = nodemailer.createTransport({
    host: "HOSTNAME", // hostname
    secureConnection: false, // TLS requires secureConnection to be false
    port: 587, // port for secure SMTP
    tls: {
        ciphers:'SSLv3'
    },
    auth: {
        user: 'USERNAME',
        pass: 'PW'
    }
});

const message = {
    from: 'YOUR_EMAIL',
    to: 'default@gmail.com',         // List of recipients
    subject: 'Default Subject', // Subject line
    text: 'Default text' // Plain text body
};

module.exports.transport = transport;
module.exports.message = message;