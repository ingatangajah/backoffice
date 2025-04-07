const nodemailer = require('nodemailer');

// Configure Mailgun SMTP settings
const transporter = nodemailer.createTransport({
  host: 'smtp.mailgun.org', // SMTP hostname
  port: 587,               // Recommended SMTP port
  secure: false,           // Use TLS (false for STARTTLS)
  auth: {
    user: 'postmaster@sandboxdf83a25315564e2585b59a472c2db530.mailgun.org', // Your Mailgun SMTP username
    pass: '8fcb94a0b29902be4e242c19861d30e8-0920befd-7920ae6d',             // Your Mailgun SMTP password
  },
});

const sendEmail = async (to, subject, text) => {
  const mailOptions = {
    from: 'Ingatan Gajah <postmaster@sandboxdf83a25315564e2585b59a472c2db530.mailgun.org>', // Replace 'YourName' with your desired sender name
    to, // Recipient email address
    subject, // Email subject
    text, // Email text content
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

module.exports = { sendEmail };
