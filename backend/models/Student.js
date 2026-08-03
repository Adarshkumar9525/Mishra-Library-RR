const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    fatherName: { type: String, trim: true },
    mobile: { type: String, required: true, trim: true, index: true },
    email: { type: String, trim: true, lowercase: true },
    address: { type: String, trim: true },
    photo: { type: String, default: "" },

    seat: { type: mongoose.Schema.Types.ObjectId, ref: "Seat" },
    seatNumber: { type: Number },
    timing: {
      type: String,
      enum: ["morning", "afternoon", "evening", "night", "full-day"],
      default: "full-day",
    },

    monthlyFee: { type: Number, required: true, default: 800 },
    joiningDate: { type: Date, required: true, default: Date.now },
    expiryDate: { type: Date, required: true },

    status: { type: String, enum: ["active", "inactive"], default: "active" },
    membershipStatus: {
      type: String,
      enum: ["active", "expired", "expiring-soon"],
      default: "active",
    },
    feeStatus: { type: String, enum: ["paid", "due", "partial"], default: "due" },

    remarks: { type: String, trim: true },
  },
  { timestamps: true }
);

// Database indexes for fast filter/sort queries (IXSCAN instead of COLLSCAN)
studentSchema.index({ expiryDate: 1 });
studentSchema.index({ joiningDate: 1 });
studentSchema.index({ status: 1 });
studentSchema.index({ feeStatus: 1, membershipStatus: 1 });
studentSchema.index({ name: "text", mobile: "text", email: "text" });

module.exports = mongoose.model("Student", studentSchema);
