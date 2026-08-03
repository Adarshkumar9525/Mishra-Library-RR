const crypto = require("crypto");
const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/apiResponse");
const generateToken = require("../utils/generateToken");
const Admin = require("../models/Admin");
const { sendEmail } = require("../config/email");

// @desc    Login admin
// @route   POST /api/auth/login
// @access  Public
const loginAdmin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return ApiResponse.error(res, 400, "Email and password are required");
  }

  const admin = await Admin.findOne({ email: email.toLowerCase() }).select("+password");

  if (!admin || !(await admin.matchPassword(password))) {
    return ApiResponse.error(res, 401, "Invalid email or password");
  }

  admin.lastLogin = new Date();
  await admin.save();

  const token = generateToken(admin._id);

  return ApiResponse.success(res, 200, "Login successful", {
    token,
    admin: {
      id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      avatar: admin.avatar,
    },
  });
});

// @desc    Get logged in admin profile
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  return ApiResponse.success(res, 200, "Profile fetched", req.admin);
});

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const admin = await Admin.findById(req.admin._id).select("+password");

  if (!(await admin.matchPassword(currentPassword))) {
    return ApiResponse.error(res, 400, "Current password is incorrect");
  }

  if (!newPassword || newPassword.length < 6) {
    return ApiResponse.error(res, 400, "New password must be at least 6 characters");
  }

  admin.password = newPassword;
  await admin.save();

  return ApiResponse.success(res, 200, "Password updated successfully");
});

// @desc    Request password reset email
// @route   POST /api/auth/forgot-password
// @access  Public (Rate-limited)
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const genericMessage = "If an account exists with this email, a reset link has been sent.";

  if (!email) {
    return ApiResponse.success(res, 200, genericMessage);
  }

  const admin = await Admin.findOne({ email: email.toLowerCase().trim() });

  if (admin) {
    // Generate raw unhashed token
    const rawToken = crypto.randomBytes(32).toString("hex");

    // Hash token to store in DB
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

    admin.resetPasswordToken = hashedToken;
    admin.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 minutes validity
    await admin.save();

    const clientUrl = process.env.CLIENT_URL || "http://localhost:5174";
    const resetUrl = `${clientUrl}/reset-password/${rawToken}`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 540px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
        <h2 style="color: #1e3a8a; margin-top: 0;">Mishra Library Study Centre</h2>
        <p style="color: #334155; font-size: 15px;">Hello ${admin.name},</p>
        <p style="color: #334155; font-size: 15px;">You requested a password reset for your administrator account. Click the button below to set a new password. This link is valid for <strong>15 minutes</strong>.</p>
        <div style="margin: 28px 0;">
          <a href="${resetUrl}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; font-weight: bold; border-radius: 8px; text-decoration: none; display: inline-block;">Reset Password</a>
        </div>
        <p style="color: #64748b; font-size: 13px;">If you did not request this reset, please ignore this email.</p>
      </div>
    `;

    try {
      await sendEmail({
        to: admin.email,
        subject: "Mishra Library ERP - Password Reset Request",
        html: htmlContent,
      });
    } catch (err) {
      console.error("Failed to send reset email:", err);
    }
  }

  return ApiResponse.success(res, 200, genericMessage);
});

// @desc    Reset password using token
// @route   POST /api/auth/reset-password/:token
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  if (!newPassword || newPassword.length < 6) {
    return ApiResponse.error(res, 400, "New password must be at least 6 characters");
  }

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const admin = await Admin.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() },
  }).select("+resetPasswordToken +resetPasswordExpires");

  if (!admin) {
    return ApiResponse.error(res, 400, "This reset link is invalid or has expired. Please request a new one.");
  }

  admin.password = newPassword;
  admin.resetPasswordToken = undefined;
  admin.resetPasswordExpires = undefined;
  await admin.save();

  return ApiResponse.success(res, 200, "Password reset successfully. You can now log in.");
});

// @desc    Logout
// @route   POST /api/auth/logout
// @access  Private
const logoutAdmin = asyncHandler(async (req, res) => {
  return ApiResponse.success(res, 200, "Logged out successfully");
});

module.exports = { loginAdmin, getMe, changePassword, forgotPassword, resetPassword, logoutAdmin };
