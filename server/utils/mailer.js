const nodemailer = require('nodemailer');

const GMAIL_USER = 'rasmit.tank0606@gmail.com';
const GMAIL_PASS = 'ctsp gmuo gpod egus';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: GMAIL_USER,
        pass: GMAIL_PASS
    }
});

module.exports = { transporter, GMAIL_USER };
