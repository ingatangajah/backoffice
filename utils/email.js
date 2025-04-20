const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: false, // Harus false untuk port 587
  auth: {
    user: '8af2ce001@smtp-brevo.com',
    pass: 'kDB5frs0MOZ6xpgz',
  },
});

const sendEmail = async (to, subject, text) => {
  try {
    await transporter.sendMail({
      from: '"Ingatangajah" <8af2ce001@smtp-brevo.com>', // nama pengirim
      to,
      subject,
      text,
    });
    console.log('Email sent successfully');
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

module.exports = { sendEmail };
