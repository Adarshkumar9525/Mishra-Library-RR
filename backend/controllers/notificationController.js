const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/apiResponse");
const Notification = require("../models/Notification");
const Student = require("../models/Student");

// @desc    Get all notifications (unread first)
// @route   GET /api/notifications
// @access  Private
const getNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find()
    .sort({ isRead: 1, createdAt: -1 })
    .limit(50)
    .populate("relatedStudent", "name mobile seatNumber");

  const unreadCount = await Notification.countDocuments({ isRead: false });

  return ApiResponse.success(res, 200, "Notifications fetched", notifications, { unreadCount });
});

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findByIdAndUpdate(
    req.params.id,
    { isRead: true },
    { new: true }
  );
  if (!notification) return ApiResponse.error(res, 404, "Notification not found");
  return ApiResponse.success(res, 200, "Notification marked as read", notification);
});

// @desc    Generate reminder notifications (due fees / expiring soon) - run on demand or via cron
// @route   POST /api/notifications/generate-reminders
// @access  Private
const generateReminders = asyncHandler(async (req, res) => {
  const now = new Date();
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const expiringSoon = await Student.find({
    expiryDate: { $gte: now, $lte: sevenDaysFromNow },
  });

  const dueFees = await Student.find({ feeStatus: { $in: ["due", "partial"] } });

  const created = [];

  for (const s of expiringSoon) {
    const exists = await Notification.findOne({
      relatedStudent: s._id,
      type: "expiring-soon",
      createdAt: { $gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
    });
    if (!exists) {
      created.push(
        await Notification.create({
          title: "Membership Expiring Soon",
          message: `${s.name} (Seat ${s.seatNumber})'s membership expires on ${s.expiryDate.toDateString()}`,
          type: "expiring-soon",
          relatedStudent: s._id,
        })
      );
    }
  }

  for (const s of dueFees) {
    const exists = await Notification.findOne({
      relatedStudent: s._id,
      type: "fee-due",
      createdAt: { $gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
    });
    if (!exists) {
      created.push(
        await Notification.create({
          title: "Fee Payment Due",
          message: `${s.name} (Seat ${s.seatNumber}) has a pending fee payment`,
          type: "fee-due",
          relatedStudent: s._id,
        })
      );
    }
  }

  return ApiResponse.success(res, 200, `${created.length} reminder(s) generated`, created);
});

module.exports = { getNotifications, markAsRead, generateReminders };
