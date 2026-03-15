// controllers/authController.js
// Handles user OTP email verification before placing order

const { db } = require("../config/db");
const nodemailer = require("nodemailer");
require("dotenv").config();

// Create email transporter (using Gmail)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // Use Gmail App Password (not regular password)
  },
});

// Generate a random 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send OTP to user's email
// POST /api/auth/send-otp
async function sendOTP(req, res) {
  try {
    const email = (req.body.email || "").trim().toLowerCase();

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    // Simple email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address",
      });
    }

    // Generate OTP
    const otp = generateOTP();

    // Set expiry time: 10 minutes from now
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Delete any old OTPs for this email (cleanup)
    await db.execute(
      "DELETE FROM otp_verifications WHERE email = ?",
      [email]
    );

    // Save new OTP in database
    await db.execute(
      "INSERT INTO otp_verifications (email, otp, expires_at) VALUES (?, ?, ?)",
      [email, otp, expiresAt]
    );

    // Send email with OTP
    const mailOptions = {
      from: `"Bhagyalakshmi Silks" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your OTP for Order Verification - Bhagyalakshmi Silks",
      html: `
        <div style="font-family: Georgia, serif; max-width: 500px; margin: 0 auto; 
                    background: #fdf8f0; padding: 40px; border-radius: 12px;
                    border: 1px solid #d4a855;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #8B0000; font-size: 28px; margin: 0;">🪡 Bhagyalakshmi Silks</h1>
            <p style="color: #666; margin-top: 5px;">Timeless Elegance, Woven with Love</p>
          </div>
          
          <h2 style="color: #333; text-align: center;">Order Verification</h2>
          <p style="color: #555; text-align: center;">
            Use the OTP below to verify your email and place your order.
          </p>
          
          <div style="background: #8B0000; color: white; font-size: 36px; 
                      font-weight: bold; text-align: center; padding: 20px; 
                      border-radius: 8px; letter-spacing: 10px; margin: 30px 0;">
            ${otp}
          </div>
          
          <p style="color: #888; text-align: center; font-size: 14px;">
            This OTP is valid for <strong>10 minutes</strong> only.
            <br>Do not share this with anyone.
          </p>
          
          <hr style="border: none; border-top: 1px solid #d4a855; margin: 20px 0;">
          <p style="color: #555; text-align: center; font-size: 13px;">
            📍 10/18, Bhagavathsingh St, near Infant Jesus School,<br>
            Kamatchiamman Colony, Kanchipuram, Tamil Nadu 631502<br>
            📞 +91 94445 46688
          </p>
          <p style="color: #aaa; text-align: center; font-size: 12px;">
            © Bhagyalakshmi Silks | Premium Silk Collections
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    return res.status(200).json({
      success: true,
      message: `OTP sent to ${email}. Please check your inbox.`,
    });
  } catch (error) {
    console.error("Send OTP error:", error);
    return res.status(500).json({
      success: false,
      message: "Error sending OTP. Please try again.",
    });
  }
}

// Verify OTP entered by user
// POST /api/auth/verify-otp
async function verifyOTP(req, res) {
  try {
    const email = (req.body.email || "").trim().toLowerCase();
    const otp = (req.body.otp || "").trim();

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    // Find OTP record in database
    const [records] = await db.execute(
      `SELECT * FROM otp_verifications 
       WHERE email = ? AND otp = ? AND is_used = 0 AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [email, otp]
    );

    if (records.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP. Please request a new one.",
      });
    }

    // Mark OTP as used so it can't be reused
    await db.execute(
      "UPDATE otp_verifications SET is_used = 1 WHERE id = ?",
      [records[0].id]
    );

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully",
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    return res.status(500).json({
      success: false,
      message: "Error verifying OTP",
    });
  }
}

module.exports = { sendOTP, verifyOTP };
