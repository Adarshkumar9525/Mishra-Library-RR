const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    amount: { type: Number, required: true, min: 0 },
    mode: { type: String, enum: ["cash", "upi", "card", "bank-transfer"], required: true },
    forMonth: { type: String, required: true }, // e.g. "2026-07"
    status: { type: String, enum: ["success", "pending", "failed"], default: "success" },
    remarks: { type: String, trim: true },
    receiptNumber: { type: String, unique: true },
    paidAt: { type: Date, default: Date.now },
    editedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Prevent duplicate payment for same student + same month
paymentSchema.index({ student: 1, forMonth: 1 }, { unique: true });
paymentSchema.index({ paidAt: -1 });
paymentSchema.index({ student: 1, paidAt: -1 });

module.exports = mongoose.model("Payment", paymentSchema);
