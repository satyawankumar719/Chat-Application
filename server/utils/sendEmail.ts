import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { ENV } from "../config/envConfig.js";

const transporter: Transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: ENV.EMAIL_USER,
    pass: ENV.EMAIL_PASS,
  },
});

const sendEmail = async (to: string, subject: string, htmlContent: string) => {
  try {
    console.log("Sending email to:", to);

    await transporter.verify();

    const mailContent = {
      from: ENV.EMAIL_USER,
      to,
      subject,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailContent);

    console.log("Email sent:", info.messageId);

    return info;
  } catch (error: any) {
    console.error("Email sending failed:", error.message);
    throw error;
  }
};

export default sendEmail;
