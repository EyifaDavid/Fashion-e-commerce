// import nodemailer from "nodemailer"
import axios from "axios";



const sendEmail = async ({ email, code }) => {
  try {
    const response = await axios.post("https://api.emailjs.com/api/v1.0/email/send", {
      service_id: process.env.EMAILJS_SERVICE_ID,
      template_id: process.env.EMAILJS_TEMPLATE_ID,
      user_id: process.env.EMAILJS_PUBLIC_KEY,
      template_params: {
        to_email: email,
        code,
      },
    });

    console.log("Email sent via EmailJS:", response.data);
  } catch (err) {
    console.error("EmailJS error:", err.response?.data || err.message);
    throw new Error("Failed to send email");
  }
};

export default sendEmail;


// const transporter = nodemailer.createTransport({
//   host: process.env.EMAIL_HOST,
//   port: process.env.EMAIL_PORT,
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS,
//   },
// });

//   const mailOptions = {
//       from: '"Mavrauder" <no-reply@mavrauder.com>',
//       to: email,
//       subject: "Your Login Code for Mavrauder",
//       text: `Your login code is: ${code}. It will expire in 10 minutes.`,
//       html: `<p>Your login code is: <b>${code}</b>. It will expire in 10 minutes.</p>`,

//     };

//     await transporter.sendMail(mailOptions);
//     console.log("Code sent to email:", email);


// export default sendEmail
