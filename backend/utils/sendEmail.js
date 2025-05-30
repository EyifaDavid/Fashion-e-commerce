import nodemailer from "nodemailer"

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

  const mailOptions = {
      from: '"Mavrauder" <no-reply@mavrauder.com>',
      to: email,
      subject: "Your Login Code for Mavrauder",
      text: `Your login code is: ${code}. It will expire in 10 minutes.`,
      html: `<p>Your login code is: <b>${code}</b>. It will expire in 10 minutes.</p>`,

    };

    await transporter.sendMail(mailOptions);
    console.log("Code sent to email:", email);


export default sendEmail
