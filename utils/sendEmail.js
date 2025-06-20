import nodemailer from 'nodemailer';

const sendEmail = async (email, subject, message) => {
  try {
    // Ensure env variables are properly parsed (port should be a number)
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587, // default to 587 if undefined
      secure: process.env.SMTP_PORT == 465, // true for 465, false for 587
      auth: {
        user: process.env.SMTP_USERNAME,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM_EMAIL,
      to: email,
      subject: subject,
      html: message,
    });

  } catch (error) {
    console.error("Failed to send email:", error);
    throw new Error("Email could not be sent");
  }
};

export default sendEmail;
