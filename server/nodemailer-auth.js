const nodemailer = require('nodemailer');
const fs = require('fs');

let sendEmail = true;
let transport = null;
let message = null;
	
if (fs.existsSync('config/config.json')) {
    let configData = fs.readFileSync('config/config.json');
    configData = JSON.parse(configData);
    if (!configData.sendEmail) {
		sendEmail = false;
    }
}

if (sendEmail) {
	transport = nodemailer.createTransport({
		host: HOSTNAME, // hostname
		secureConnection: false, // TLS requires secureConnection to be false
		port: 587, // port for secure SMTP
		tls: {
			ciphers:'SSLv3'
		},
		auth: {
			user: USERNAME,
			pass: PW
		}
	});
	message = {
		from: YOUR_EMAIL,
		to: 'default@gmail.com',         // List of recipients
		subject: 'Default Subject', // Subject line
		text: 'Default text' // Plain text body
	};
}

module.exports.transport = transport;
module.exports.message = message;




