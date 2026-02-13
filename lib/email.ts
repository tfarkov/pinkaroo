import nodemailer from 'nodemailer';

function getTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.NODEMAILER_USER,
      pass: process.env.NODEMAILER_PASS,
    },
  });
}

export async function sendEmail(to: string, subject: string, text: string) {
  const transporter = getTransporter();
  await transporter.sendMail({
    from: process.env.NODEMAILER_USER,
    to,
    subject,
    text,
  });
}
