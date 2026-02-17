import bcrypt from "bcryptjs";
import User from "../models/user.js";
import dotenv from "dotenv";
import { createJWT } from "../utils/index.js";
import { sendLoginCodeEmail } from "../utils/sendEmail.js";

dotenv.config();

export const signup = async (req, res) => {
  const { email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
  if (existingUser) return res.status(400).json({ msg: 'User already exists' });

  const hashedPassword = await bcrypt.hash(password, 10);
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const codeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 min

  const user = new User({
      email,
      password: hashedPassword,
      code,
      codeExpires,
    });
    await user.save();

  await sendLoginCodeEmail(email, code);

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


export const login = async (req, res) => {
  const { email } = req.body;
  const demoModeValue = String(process.env.DEMO_MODE || "").toLowerCase();
  const isDemoMode = ["true", "1", "yes", "on"].includes(demoModeValue);

 if (!email) return res.status(400).json({ msg: "Email is required" });

  try {
    let user = await User.findOne({ email });
    const code = Math.floor(100000 + Math.random() * 900000).toString(); // e.g., "791320"
    const codeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    if (!user) {
      // Create new user with code and expiry
      user = new User({
        email,
        code,
        codeExpires,
      });
    } else {
      // Update existing user with new code and expiry
      user.code = code;
      user.codeExpires = codeExpires;
    }

    await user.save();

    let emailSent = false;
    let useDemoFallback = isDemoMode;
    try {
      await sendLoginCodeEmail(email, code);
      emailSent = true;
      console.log("Code sent to email:", email);
    } catch (emailErr) {
      console.error("Email delivery failed:", emailErr.message);
      const resendTestingRestriction =
        typeof emailErr?.message === "string" &&
        emailErr.message.includes(
          "You can only send testing emails to your own email address"
        );

      useDemoFallback = isDemoMode || resendTestingRestriction;

      if (!useDemoFallback) {
        throw emailErr;
      }
    }

    console.log(`Code for ${email}: ${code}`);
    res.status(200).json({
      msg: emailSent
        ? "Login code sent to email"
        : "Demo mode active: email delivery unavailable, use demo code",
      email,
      demoMode: useDemoFallback && !emailSent,
      demoCode: useDemoFallback && !emailSent ? code : undefined,
    });
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
