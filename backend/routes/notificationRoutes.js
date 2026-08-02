const express = require("express");
const router = express.Router();
const {
  getNotifications,
  markAsRead,
  generateReminders,
} = require("../controllers/notificationController");
const { protect } = require("../middleware/auth");

router.use(protect);

router.get("/", getNotifications);
router.put("/:id/read", markAsRead);
router.post("/generate-reminders", generateReminders);

module.exports = router;
