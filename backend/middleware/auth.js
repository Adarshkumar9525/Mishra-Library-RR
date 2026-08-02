const jwt = require("jsonwebtoken");
const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/apiResponse");
const Admin = require("../models/Admin");

const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return ApiResponse.error(res, 401, "Not authorized, no token provided");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = await Admin.findById(decoded.id).select("-password");

    if (!req.admin) {
      return ApiResponse.error(res, 401, "Not authorized, admin not found");
    }

    next();
  } catch (error) {
    return ApiResponse.error(res, 401, "Not authorized, token invalid or expired");
  }
});

module.exports = { protect };
