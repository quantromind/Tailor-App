require('dotenv').config();
const nodemailer = require('nodemailer');

console.log('MAIL_USER:', process.env.MAIL_USER);
console.log('MAIL_PASS:', process.env.MAIL_PASS ? `${process.env.MAIL_PASS.length} chars` : 'NOT SET');
console.log('ADMIN_EMAIL:', process.env.ADMIN_EMAIL);

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
    },
});

transporter.verify((error, success) => {
    if (error) {
        console.error('❌ Gmail auth FAILED:', error.message);
        console.error('Full error:', error);
    } else {
        console.log('✅ Gmail auth SUCCESS — sending test email...');

        transporter.sendMail({
            from: `"eTailoring App" <${process.env.MAIL_USER}>`,
            to: process.env.ADMIN_EMAIL,
            subject: '✅ Test Email — eTailoring Mailer Working',
            html: `<h2>Email system is working!</h2><p>If you see this, the mailer is correctly configured.</p>`,
        }, (err, info) => {
            if (err) {
                console.error('❌ Send FAILED:', err.message);
            } else {
                console.log('✅ Email sent! Message ID:', info.messageId);
                console.log('Accepted by:', info.accepted);
            }
        });
    }
});
