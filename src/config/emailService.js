import nodemailer from "nodemailer";

export const sendEmail = async (to, subject, message) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER, // Your email (Gmail recommended)
      pass: process.env.EMAIL_PASS, // Your email password or App Password
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    html: `<p>${message}</p>`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully to:", to);
  } catch (error) {
    console.error("Error sending email:", error);
  }
};
