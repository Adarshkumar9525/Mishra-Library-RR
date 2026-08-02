const express = require("express");
const router = express.Router();
const { loginAdmin, getMe, changePassword, logoutAdmin } = require("../controllers/authController");
const { protect } = require("../middleware/auth");
const { loginLimiter } = require("../middleware/rateLimiter");

router.post("/login", loginLimiter, loginAdmin);
router.get("/me", protect, getMe);
router.put("/change-password", protect, changePassword);
router.post("/logout", protect, logoutAdmin);

module.exports = router;
