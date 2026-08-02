const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/apiResponse");
const generateToken = require("../utils/generateToken");
const Admin = require("../models/Admin");

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

// @desc    Logout (client just discards token; endpoint kept for consistency/future blacklist)
// @route   POST /api/auth/logout
// @access  Private
const logoutAdmin = asyncHandler(async (req, res) => {
  return ApiResponse.success(res, 200, "Logged out successfully");
});

module.exports = { loginAdmin, getMe, changePassword, logoutAdmin };
