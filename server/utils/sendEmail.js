import nodemailer from 'nodemailer';
import { ENV} from '../config/envConfig.js';

const sendEmail = async (to, subject, htmlContent) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: ENV.EMAIL_USER, 
      pass: ENV.EMAIL_PASS, 
    },
  });

  const mailContent = {
    from: ENV.EMAIL_USER,
    to,
    subject,
    html: htmlContent
  };

  await transporter.sendMail(mailContent);
};

export default sendEmail;
