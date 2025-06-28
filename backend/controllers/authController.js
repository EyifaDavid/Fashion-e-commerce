import bcrypt from "bcryptjs";
import User from "../models/user.js";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { createJWT } from "../utils/index.js";


dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});


export const signup = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({email})
  if (existingUser) return res.status(400).json({ msg: 'User already exists' });

  const hashedPassword = await bcrypt.hash(password, 10);
  const code = Math.floor(100000 + Math.random() * 900000); // 6-digit code
  const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min

  user = new User({
      email,
      password: hashedPassword,
      verificationCode: code,
      verificationCodeExpires: expiry,
    });
    await user.save();

  await sendEmail(email, 'Your Verification Code', `Your code is: ${code}`);

  res.json({ msg: 'Signup successful. Check your email for the code.' });

  } catch (err) {
    res.status(500).json({msg:'Signup unsuccessful, Try again'})
  }
};

// export const verifyCode = async (req, res) => {
//   const { email, code } = req.body;

//   try {
//     const user = await User.findOne({ email });
//     if (!user) return res.status(404).json({ msg: 'User not found' });

//     if (user.isVerified) return res.status(400).json({ msg: 'Already verified' });

//     if (user.verificationCode !== parseInt(code)) {
//       return res.status(400).json({ msg: 'Invalid code' });
//     }

//     if (user.verificationCodeExpires < new Date()) {
//       return res.status(400).json({ msg: 'Code expired' });
//     }

//     user.isVerified = true;
//     user.verificationCode = null;
//     user.verificationCodeExpires = null;
//     await user.save();

//     const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
//     res.json({ msg: 'Email verified', token });
//   } catch (err) {
//     res.status(500).json({ msg: 'Server error' });
//   }
// };


// export const login = async (req, res) => {
//   const { email } = req.body;

//  if (!email) return res.status(400).json({ msg: "Email is required" });

//   try {
//     let user = await User.findOne({ email });
//     const code = Math.floor(100000 + Math.random() * 900000).toString(); // e.g., "791320"
//     const codeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

//     if (!user) {
//       // Create new user with code and expiry
//       user = new User({
//         email,
//         code,
//         codeExpires,
//       });
//     } else {
//       // Update existing user with new code and expiry
//       user.code = code;
//       user.codeExpires = codeExpires;
//     }

//     await user.save();

//     const mailOptions = {
//       from: '"Mavrauder" <no-reply@mavrauder.com>',
//       to: email,
//       subject: "Your Login Code for Mavrauder",
//       text: `Your login code is: ${code}. It will expire in 10 minutes.`,
//       html: `
//       <div>
//       <p>Hi fam,</p>
//       <p>Your login code is: <b>${code}</b>. It will expire in 10 minutes.</p>
//       <p>Congratulations, you're no longer a virgin Thanks for fucking with us<p/>
//       </div>`,
      
//     };

//     await transporter.sendMail(mailOptions);
//     console.log("Code sent to email:", email);

//     console.log(`Code for ${email}: ${code}`);
//     res.status(200).json({ msg: "Login code sent to email", email });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ msg: "Server error" });
//   }

// };


export const login = async (req, res) => {
  const { email } = req.body;

  if (!email) return res.status(400).json({ msg: "Email is required" });

  try {
    let user = await User.findOne({ email });
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const codeExpires = new Date(Date.now() + 10 * 60 * 1000);

    if (!user) {
      user = new User({ email, code, codeExpires });
    } else {
      user.code = code;
      user.codeExpires = codeExpires;
    }

    await user.save();

    await sendEmail({ email, code });

    console.log(`Code for ${email}: ${code}`);
    res.status(200).json({ msg: "Login code sent to email", email });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
};



export const verify = async(req,res) => {
 const { email, code } = req.body;
  if (!email || !code) return res.status(400).json({ msg: "Email and code required" });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ msg: "User not found" });

    console.log("Submitted code:", code);
    console.log("Stored code:", user.code);
    console.log("Code expiry:", user.codeExpires);
    console.log("Current time:", new Date());

    if (user.code !== code || user.codeExpires < Date.now()) {
      return res.status(400).json({ msg: "Invalid or expired code" });
    }

    createJWT(res,user._id)

    console.log("Cookie set!");
    console.log("Cookies received:", req.cookies);

    user.isVerified = true;
    user.code = null;
    user.codeExpires = null;
    await user.save();

    res.status(200).json({ msg: "Login successful", user: {
       id: user._id, 
       email: user.email, 
       isAdmin: user.isAdmin,
       role: user.role,
       joinedOn: user.joinedOn ? user.joinedOn.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : null,
      } });

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
};
