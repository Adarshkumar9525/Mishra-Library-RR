const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/apiResponse");
const Seat = require("../models/Seat");
const Student = require("../models/Student");

const ALL_TIMINGS = ["morning", "afternoon", "evening", "night"];
const STUDENT_FIELDS = "name mobile expiryDate feeStatus";

// @desc    Get all seats with full per-timing slot detail
// @route   GET /api/seats
// @access  Private
const getSeats = asyncHandler(async (req, res) => {
  const seats = await Seat.find()
    .select("-history")
    .sort({ seatNumber: 1 })
    .populate("slots.morning.student", STUDENT_FIELDS)
    .populate("slots.afternoon.student", STUDENT_FIELDS)
    .populate("slots.evening.student", STUDENT_FIELDS)
    .populate("slots.night.student", STUDENT_FIELDS)
    .lean();

  res.setHeader("Cache-Control", "private, max-age=15");
  return ApiResponse.success(res, 200, "Seats fetched", seats);
});

// @desc    Get single seat with slot detail + history
// @route   GET /api/seats/:id
// @access  Private
const getSeatById = asyncHandler(async (req, res) => {
  const seat = await Seat.findById(req.params.id)
    .populate("slots.morning.student", STUDENT_FIELDS)
    .populate("slots.afternoon.student", STUDENT_FIELDS)
    .populate("slots.evening.student", STUDENT_FIELDS)
    .populate("slots.night.student", STUDENT_FIELDS)
    .populate("history.student", "name mobile");

  if (!seat) return ApiResponse.error(res, 404, "Seat not found");

  return ApiResponse.success(res, 200, "Seat fetched", seat);
});

// @desc    Check seat availability for a given timing (used by the admission form)
// @route   GET /api/seats/:seatNumber/availability?timing=morning
// @access  Private
const checkAvailability = asyncHandler(async (req, res) => {
  const { timing = "full-day" } = req.query;
  const seat = await Seat.findOne({ seatNumber: req.params.seatNumber });

  if (!seat) return ApiResponse.error(res, 404, "Seat not found");

  const available = seat.isAvailableFor(timing);
  return ApiResponse.success(res, 200, "Availability checked", { available, seatNumber: seat.seatNumber, timing });
});

// @desc    Update seat status for a specific timing slot (reserve / maintenance / available)
// @route   PUT /api/seats/:id/status
// @access  Private
const updateSeatStatus = asyncHandler(async (req, res) => {
  const { status, timing } = req.body;
  const validStatuses = ["available", "occupied", "reserved", "maintenance"];

  if (!validStatuses.includes(status)) {
    return ApiResponse.error(res, 400, "Invalid seat status");
  }
  if (!ALL_TIMINGS.includes(timing)) {
    return ApiResponse.error(res, 400, "timing must be one of: morning, afternoon, evening, night");
  }

  const seat = await Seat.findById(req.params.id);
  if (!seat) return ApiResponse.error(res, 404, "Seat not found");

  if (status !== "occupied" && seat.slots[timing].student) {
    return ApiResponse.error(res, 400, "Vacate this shift from the student record first");
  }

  seat.slots[timing].status = status;
  await seat.save();

  return ApiResponse.success(res, 200, "Seat slot updated", seat);
});

// @desc    Transfer a student from one seat to another (only for the shift(s) they hold)
// @route   PUT /api/seats/transfer
// @access  Private
const transferSeat = asyncHandler(async (req, res) => {
  const { studentId, newSeatId } = req.body;

  const student = await Student.findById(studentId);
  if (!student) return ApiResponse.error(res, 404, "Student not found");

  const newSeat = await Seat.findById(newSeatId);
  if (!newSeat) return ApiResponse.error(res, 404, "New seat not found");

  const timings = Seat.resolveTimings(student.timing);

  if (!newSeat.isAvailableFor(student.timing)) {
    return ApiResponse.error(
      res,
      400,
      `Seat ${newSeat.seatNumber} is not free for the student's ${student.timing} shift`
    );
  }

  const oldSeat = student.seat ? await Seat.findById(student.seat) : null;

  if (oldSeat) {
    timings.forEach((t) => {
      if (oldSeat.slots[t].student && oldSeat.slots[t].student.toString() === student._id.toString()) {
        oldSeat.slots[t].status = "available";
        oldSeat.slots[t].student = null;
      }
    });
    oldSeat.history.push({
      student: student._id,
      timing: student.timing,
      assignedDate: student.joiningDate,
      vacatedDate: new Date(),
      reason: "transfer",
    });
    await oldSeat.save();
  }

  timings.forEach((t) => {
    newSeat.slots[t].status = "occupied";
    newSeat.slots[t].student = student._id;
  });
  await newSeat.save();

  student.seat = newSeat._id;
  student.seatNumber = newSeat.seatNumber;
  await student.save();

  return ApiResponse.success(res, 200, "Seat transferred successfully", { student, newSeat });
});

module.exports = { getSeats, getSeatById, checkAvailability, updateSeatStatus, transferSeat };
