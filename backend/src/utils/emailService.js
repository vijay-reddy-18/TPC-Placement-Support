const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

const sendEmail = async (to, subject, html) => {
    try {
        const mailOptions = {
            from: `"${process.env.EMAIL_FROM_NAME || 'Placement Department'}" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html,
        };

        await transporter.sendMail(mailOptions);
        console.log(`[EMAIL SENT] To: ${to}, Subject: ${subject}`);
    } catch (error) {
        console.error('[EMAIL ERROR]', {
            to,
            subject,
            error: error.message,
        });
        throw error;
    }
};

module.exports = sendEmail;
