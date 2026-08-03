const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/apiResponse");
const Payment = require("../models/Payment");
const Student = require("../models/Student");

// Generates a receipt number like MLR-2026-000123
const generateReceiptNumber = async () => {
  const year = new Date().getFullYear();
  const count = await Payment.countDocuments();
  return `MLR-${year}-${String(count + 1).padStart(6, "0")}`;
};

// @desc    Get all payments (paginated + filterable)
// @route   GET /api/payments
// @access  Private
const getPayments = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, student, mode, forMonth } = req.query;

  const filter = {};
  if (student) filter.student = student;
  if (mode) filter.mode = mode;
  if (forMonth) filter.forMonth = forMonth;

  const skip = (Number(page) - 1) * Number(limit);

  const [payments, total] = await Promise.all([
    Payment.find(filter)
      .sort({ paidAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate("student", "name mobile seatNumber"),
    Payment.countDocuments(filter),
  ]);

  return ApiResponse.success(res, 200, "Payments fetched", payments, {
    page: Number(page),
    limit: Number(limit),
    total,
    totalPages: Math.ceil(total / Number(limit)),
  });
});

// @desc    Add new payment (with duplicate-for-month prevention)
// @route   POST /api/payments
// @access  Private
const createPayment = asyncHandler(async (req, res) => {
  const { student: studentId, amount, mode, forMonth, remarks, paidAt } = req.body;

  const student = await Student.findById(studentId);
  if (!student) return ApiResponse.error(res, 404, "Student not found");

  const existing = await Payment.findOne({ student: studentId, forMonth });
  if (existing) {
    return ApiResponse.error(res, 409, `Payment for ${forMonth} already recorded for this student`);
  }

  const receiptNumber = await generateReceiptNumber();

  const payment = await Payment.create({
    student: studentId,
    amount,
    mode,
    forMonth,
    remarks,
    receiptNumber,
    paidAt: paidAt ? new Date(paidAt) : Date.now(),
  });

  // Update student fee status - if they've paid for the current cycle
  student.feeStatus = "paid";
  await student.save();

  return ApiResponse.success(res, 201, "Payment recorded successfully", payment);
});

// @desc    Update existing payment record
// @route   PUT /api/payments/:id
// @access  Private
const updatePayment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { amount, mode, forMonth, remarks, paidAt } = req.body;

  const payment = await Payment.findById(id);
  if (!payment) return ApiResponse.error(res, 404, "Payment not found");

  // Validate amount if provided
  if (amount !== undefined) {
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return ApiResponse.error(res, 400, "Amount must be a positive number");
    }
    payment.amount = numAmount;
  }

  // Validate mode if provided
  if (mode !== undefined) {
    const validModes = ["cash", "upi", "card", "bank-transfer"];
    if (!validModes.includes(mode)) {
      return ApiResponse.error(res, 400, "Invalid payment mode");
    }
    payment.mode = mode;
  }

  // Check and update forMonth if provided
  if (forMonth !== undefined && forMonth !== payment.forMonth) {
    if (typeof forMonth !== "string" || !forMonth.match(/^\d{4}-\d{2}$/)) {
      return ApiResponse.error(res, 400, "forMonth must be in YYYY-MM format");
    }

    const existing = await Payment.findOne({
      student: payment.student,
      forMonth,
      _id: { $ne: payment._id },
    });

    if (existing) {
      return ApiResponse.error(res, 409, `A payment for ${forMonth} already exists for this student`);
    }

    payment.forMonth = forMonth;
  }

  if (paidAt !== undefined && paidAt) {
    const parsedDate = new Date(paidAt);
    if (isNaN(parsedDate.getTime())) {
      return ApiResponse.error(res, 400, "Invalid payment date");
    }
    payment.paidAt = parsedDate;
  }

  if (remarks !== undefined) {
    payment.remarks = remarks;
  }

  payment.editedAt = new Date();
  await payment.save();
  await payment.populate("student", "name mobile seatNumber");

  // Keep student's fee status consistent
  const student = await Student.findById(payment.student);
  if (student) {
    student.feeStatus = "paid";
    await student.save();
  }

  return ApiResponse.success(res, 200, "Payment updated successfully", payment);
});

// @desc    Delete payment record
// @route   DELETE /api/payments/:id
// @access  Private
const deletePayment = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id);
  if (!payment) return ApiResponse.error(res, 404, "Payment not found");
  await payment.deleteOne();
  return ApiResponse.success(res, 200, "Payment deleted successfully");
});

// @desc    Get payment history for a specific student
// @route   GET /api/payments/student/:studentId
// @access  Private
const getStudentPaymentHistory = asyncHandler(async (req, res) => {
  const payments = await Payment.find({ student: req.params.studentId }).sort({ paidAt: -1 });
  return ApiResponse.success(res, 200, "Payment history fetched", payments);
});

// @desc    Collection summary (today / month / year / total)
// @route   GET /api/payments/summary
// @access  Private
const getCollectionSummary = asyncHandler(async (req, res) => {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  const sum = async (from) =>
    (
      await Payment.aggregate([
        { $match: { paidAt: { $gte: from }, status: "success" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ])
    )[0]?.total || 0;

  const [today, month, year, total] = await Promise.all([
    sum(startOfToday),
    sum(startOfMonth),
    sum(startOfYear),
    sum(new Date(0)),
  ]);

  return ApiResponse.success(res, 200, "Collection summary fetched", { today, month, year, total });
});

module.exports = {
  getPayments,
  createPayment,
  updatePayment,
  deletePayment,
  getStudentPaymentHistory,
  getCollectionSummary,
};
