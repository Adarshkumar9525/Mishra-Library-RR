const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/apiResponse");
const Student = require("../models/Student");
const Seat = require("../models/Seat");

// @desc    Get all students (paginated, filterable, searchable)
// @route   GET /api/students
// @access  Private
const getStudents = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    search,
    name,
    status,
    feeStatus,
    membershipStatus,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = req.query;

  const filter = {};
  if (status) filter.status = status;
  if (feeStatus) filter.feeStatus = feeStatus;
  if (membershipStatus) filter.membershipStatus = membershipStatus;
  if (name) {
    // Search specifically by student name (case-insensitive partial match)
    filter.name = { $regex: name, $options: "i" };
  } else if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { mobile: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

  const [students, total] = await Promise.all([
    Student.find(filter).sort(sort).skip(skip).limit(Number(limit)).populate("seat", "seatNumber").lean(),
    Student.countDocuments(filter),
  ]);

  return ApiResponse.success(res, 200, "Students fetched", students, {
    page: Number(page),
    limit: Number(limit),
    total,
    totalPages: Math.ceil(total / Number(limit)),
  });
});

// @desc    Get single student with full details
// @route   GET /api/students/:id
// @access  Private
const getStudentById = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id).populate("seat", "seatNumber slots");
  if (!student) return ApiResponse.error(res, 404, "Student not found");
  return ApiResponse.success(res, 200, "Student fetched", student);
});

// @desc    Add new student + assign seat for their chosen timing/shift only
// @route   POST /api/students
// @access  Private
const createStudent = asyncHandler(async (req, res) => {
  const { seatNumber, monthlyFee, joiningDate, expiryDate: expiryDateInput, timing = "full-day" } = req.body;

  const seat = await Seat.findOne({ seatNumber });
  if (!seat) return ApiResponse.error(res, 404, "Seat not found");

  // Only block if the requested shift(s) overlap with an existing booking on this seat.
  // e.g. seat already booked for "morning" does NOT block a new "evening" admission.
  if (!seat.isAvailableFor(timing)) {
    return ApiResponse.error(
      res,
      400,
      `Seat ${seatNumber} is already booked for an overlapping shift. Choose a different seat or timing.`
    );
  }

  const joinDate = joiningDate ? new Date(joiningDate) : new Date();
  let expiryDate;
  if (expiryDateInput) {
    expiryDate = new Date(expiryDateInput);
  } else {
    expiryDate = new Date(joinDate);
    expiryDate.setDate(expiryDate.getDate() + 30);
  }

  const student = await Student.create({
    ...req.body,
    timing,
    seat: seat._id,
    seatNumber: seat.seatNumber,
    monthlyFee: monthlyFee || process.env.DEFAULT_MONTHLY_FEE || 800,
    joiningDate: joinDate,
    expiryDate,
  });

  const timingsToOccupy = Seat.resolveTimings(timing);
  timingsToOccupy.forEach((t) => {
    seat.slots[t].status = "occupied";
    seat.slots[t].student = student._id;
  });
  await seat.save();

  return ApiResponse.success(res, 201, "Student added successfully", student);
});

// @desc    Update student details (handles info updates, shift/timing changes, and seat updates)
// @route   PUT /api/students/:id
// @access  Private
const updateStudent = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (!student) return ApiResponse.error(res, 404, "Student not found");

  const { joiningDate, expiryDate, seatNumber: newSeatNumberInput, timing: newTimingInput, ...rest } = req.body;

  const oldTiming = student.timing;
  const oldSeatId = student.seat;
  const oldSeatNumber = student.seatNumber;

  const newTiming = newTimingInput || oldTiming;
  const newSeatNumber =
    newSeatNumberInput !== undefined && newSeatNumberInput !== "" ? Number(newSeatNumberInput) : oldSeatNumber;

  const isTimingChanged = newTiming !== oldTiming;
  const isSeatChanged = newSeatNumber !== oldSeatNumber;

  if (isTimingChanged || isSeatChanged) {
    // 1. Resolve target seat (either new seat if seat number changed, or current seat)
    const targetSeat = isSeatChanged
      ? await Seat.findOne({ seatNumber: newSeatNumber })
      : (oldSeatId
          ? await Seat.findById(oldSeatId)
          : (oldSeatNumber ? await Seat.findOne({ seatNumber: oldSeatNumber }) : null));

    if (!targetSeat) {
      return ApiResponse.error(res, 404, `Seat #${newSeatNumber} not found`);
    }

    // 2. Check if target seat is free for newTiming (ignoring current student's existing slots)
    if (!targetSeat.isAvailableFor(newTiming, student._id)) {
      return ApiResponse.error(
        res,
        400,
        `Seat #${targetSeat.seatNumber} is already booked for an overlapping shift for the ${newTiming} timing`
      );
    }

    // 3. Free up old timing slots on old seat held by this student
    const oldSeat = oldSeatId
      ? await Seat.findById(oldSeatId)
      : (oldSeatNumber ? await Seat.findOne({ seatNumber: oldSeatNumber }) : null);

    if (oldSeat) {
      const oldTimingsToFree = Seat.resolveTimings(oldTiming);
      oldTimingsToFree.forEach((t) => {
        if (oldSeat.slots[t].student && oldSeat.slots[t].student.toString() === student._id.toString()) {
          oldSeat.slots[t].status = "available";
          oldSeat.slots[t].student = null;
        }
      });

      if (isSeatChanged) {
        oldSeat.history.push({
          student: student._id,
          timing: oldTiming,
          assignedDate: student.joiningDate,
          vacatedDate: new Date(),
          reason: "transfer",
        });
      }

      await oldSeat.save();
    }

    // 4. Occupy new timing slots on targetSeat
    // If targetSeat is the same document as oldSeat, use oldSeat reference so we don't overwrite freed slots with stale targetSeat data
    const activeSeat = oldSeat && oldSeat._id.toString() === targetSeat._id.toString() ? oldSeat : targetSeat;

    const newTimingsToOccupy = Seat.resolveTimings(newTiming);
    newTimingsToOccupy.forEach((t) => {
      activeSeat.slots[t].status = "occupied";
      activeSeat.slots[t].student = student._id;
    });

    await activeSeat.save();

    student.seat = activeSeat._id;
    student.seatNumber = activeSeat.seatNumber;
    student.timing = newTiming;
  }

  // Update remaining student fields
  Object.assign(student, rest);

  const joiningDateChanged = joiningDate && new Date(joiningDate).getTime() !== new Date(student.joiningDate).getTime();

  if (joiningDate) student.joiningDate = new Date(joiningDate);

  if (expiryDate) {
    // Explicit expiry override always wins
    student.expiryDate = new Date(expiryDate);
  } else if (joiningDateChanged) {
    // Recompute default 30-day cycle if joining date changed without explicit expiry
    const recalculated = new Date(student.joiningDate);
    recalculated.setDate(recalculated.getDate() + 30);
    student.expiryDate = recalculated;
  }

  await student.save();
  return ApiResponse.success(res, 200, "Student updated successfully", student);
});

// @desc    Delete student + free up only the shift(s) they held on their seat
// @route   DELETE /api/students/:id
// @access  Private
const deleteStudent = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (!student) return ApiResponse.error(res, 404, "Student not found");

  if (student.seat) {
    const seat = await Seat.findById(student.seat);
    if (seat) {
      const timingsToFree = Seat.resolveTimings(student.timing);
      timingsToFree.forEach((t) => {
        if (seat.slots[t].student && seat.slots[t].student.toString() === student._id.toString()) {
          seat.slots[t].status = "available";
          seat.slots[t].student = null;
        }
      });
      seat.history.push({
        student: student._id,
        timing: student.timing,
        assignedDate: student.joiningDate,
        vacatedDate: new Date(),
        reason: "cancelled",
      });
      await seat.save();
    }
  }

  await student.deleteOne();
  return ApiResponse.success(res, 200, "Student deleted successfully");
});

// @desc    Renew membership (extend expiry by 30 days) - seat/shift unaffected
// @route   PUT /api/students/:id/renew
// @access  Private
const renewMembership = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (!student) return ApiResponse.error(res, 404, "Student not found");

  const now = new Date();
  const base = student.expiryDate > now ? student.expiryDate : now;
  const newExpiry = new Date(base);
  newExpiry.setDate(newExpiry.getDate() + 30);

  student.expiryDate = newExpiry;
  student.membershipStatus = "active";
  student.status = "active";
  await student.save();

  return ApiResponse.success(res, 200, "Membership renewed successfully", student);
});

module.exports = {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  renewMembership,
};
