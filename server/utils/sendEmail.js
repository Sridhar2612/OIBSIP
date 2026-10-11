const nodemailer = require('nodemailer');

const sendEmail = async ({ to, subject, html, text }) => {
  try {
    // Create transporter
    let transporter;
    if (process.env.SMTP_USER && process.env.SMTP_USER !== 'your_smtp_user' && process.env.SMTP_USER !== 'test_user') {
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.ethereal.email',
        port: parseInt(process.env.SMTP_PORT, 10) || 587,
        secure: process.env.SMTP_PORT === '465',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD
        }
      });
    } else {
      // Create automated test account with Ethereal if real SMTP is not set
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
    }

    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"SliceCraft Pizza" <no-reply@slicecraft.com>',
      to,
      subject,
      text: text || subject,
      html
    });

    console.log(`[Email Sent]: Message ID -> ${info.messageId}`);
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`📨 [Ethereal Email Preview URL]: ${previewUrl}`);
    }

    return { success: true, messageId: info.messageId, previewUrl };
  } catch (error) {
    console.error(`[Email Dispatch Error]: ${error.message}`);
    return { success: false, error: error.message };
  }
};

module.exports = sendEmail;
