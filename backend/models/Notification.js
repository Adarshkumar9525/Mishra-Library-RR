const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ["fee-due", "expiring-soon", "expired", "admission", "system"],
      default: "system",
    },
    relatedStudent: { type: mongoose.Schema.Types.ObjectId, ref: "Student" },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);
