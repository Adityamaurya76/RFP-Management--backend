import nodemailer from 'nodemailer';
import { ApiResponse } from "../utils/api-response.js";
import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/async-handler.js";

// Lazy initialization - transporter tab banega jab actually use hoga
let transporter = null;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
};

const sendEmail = async ({ to, subject, html }) => {
  try {
    const emailTransporter = getTransporter();
    
    console.log("📧 Sending email to:", to);
    console.log("📧 SMTP Host:", process.env.SMTP_HOST);
    
    await emailTransporter.sendMail({
      from: `"RFP System" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });

    console.log("✅ Email sent successfully!");
    return { success: true };
  } catch (err) {
    console.log("❌ Email Send Error:", err);
    throw new ApiError(400, [], "Something went wrong" );
  }
};

export { sendEmail };