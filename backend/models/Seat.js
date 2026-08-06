const mongoose = require("mongoose");

// A single timing slot on a seat: independently occupiable so a seat can be
// shared across shifts (e.g. Student A takes morning, Student B takes evening
// on the SAME seat number, without conflicting with each other).
const slotSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ["available", "occupied", "reserved", "maintenance"],
      default: "available",
    },
    student: { type: mongoose.Schema.Types.ObjectId, ref: "Student", default: null },
  },
  { _id: false }
);

const seatSchema = new mongoose.Schema(
  {
    seatNumber: { type: Number, required: true, unique: true, min: 1, max: 100 },

    // One independent slot per shift. A "full-day" admission occupies all four.
    slots: {
      morning: { type: slotSchema, default: () => ({}) },
      afternoon: { type: slotSchema, default: () => ({}) },
      evening: { type: slotSchema, default: () => ({}) },
      night: { type: slotSchema, default: () => ({}) },
    },

    history: [
      {
        student: { type: mongoose.Schema.Types.ObjectId, ref: "Student" },
        timing: String, // which shift(s) this history entry relates to
        assignedDate: Date,
        vacatedDate: Date,
        reason: String, // 'transfer' | 'expired' | 'cancelled'
      },
    ],
  },
  { timestamps: true }
);

const ALL_TIMINGS = ["morning", "afternoon", "evening", "night"];

// Given a student's chosen timing ("morning" | ... | "full-day"),
// returns the list of actual slot keys that timing occupies.
seatSchema.statics.resolveTimings = function (timing) {
  return timing === "full-day" ? ALL_TIMINGS : [timing];
};

// Checks whether this seat is free for the given timing (no overlap with existing bookings).
seatSchema.methods.isAvailableFor = function (timing, ignoreStudentId = null) {
  const timings = this.constructor.resolveTimings(timing);
  return timings.every((t) => {
    const slot = this.slots[t];
    if (slot.status === "available") return true;
    if (ignoreStudentId && slot.student && slot.student.toString() === ignoreStudentId.toString()) return true;
    return false;
  });
};

seatSchema.index({ "slots.morning.status": 1 });
seatSchema.index({ "slots.afternoon.status": 1 });
seatSchema.index({ "slots.evening.status": 1 });
seatSchema.index({ "slots.night.status": 1 });

module.exports = mongoose.model("Seat", seatSchema);
