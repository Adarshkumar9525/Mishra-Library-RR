const express = require("express");
const router = express.Router();
const { loginAdmin, getMe, changePassword, forgotPassword, resetPassword, logoutAdmin } = require("../controllers/authController");
const { protect } = require("../middleware/auth");
const { loginLimiter, forgotPasswordLimiter } = require("../middleware/rateLimiter");

router.post("/login", loginLimiter, loginAdmin);
router.post("/forgot-password", forgotPasswordLimiter, forgotPassword);
router.post("/reset-password/:token", resetPassword);
router.get("/me", protect, getMe);
router.put("/change-password", protect, changePassword);
router.post("/logout", protect, logoutAdmin);

module.exports = router;
