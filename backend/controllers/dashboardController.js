const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/apiResponse");
const Student = require("../models/Student");
const Seat = require("../models/Seat");
const Payment = require("../models/Payment");

// @desc    Get dashboard summary stats
// @route   GET /api/dashboard/stats
// @access  Private
const getStats = asyncHandler(async (req, res) => {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  // A seat is "fully occupied" only when ALL four shifts are taken.
  // If even one shift (e.g. evening) is free, the seat still counts as available for booking.
  const fullyOccupiedFilter = {
    "slots.morning.status": "occupied",
    "slots.afternoon.status": "occupied",
    "slots.evening.status": "occupied",
    "slots.night.status": "occupied",
  };

  const [
    totalStudents,
    activeStudents,
    totalSeats,
    fullyOccupiedSeats,
    pendingFeeCount,
    todayAdmissions,
    expiringSoon,
    expiredMemberships,
    todayCollectionAgg,
    monthlyCollectionAgg,
    totalCollectionAgg,
    recentStudents,
    recentPayments,
  ] = await Promise.all([
    Student.countDocuments(),
    Student.countDocuments({ status: "active" }),
    Seat.countDocuments(),
    Seat.countDocuments(fullyOccupiedFilter),
    Student.countDocuments({ feeStatus: { $in: ["due", "partial"] } }),
    Student.countDocuments({ joiningDate: { $gte: startOfToday } }),
    Student.countDocuments({ expiryDate: { $gte: now, $lte: sevenDaysFromNow } }),
    Student.countDocuments({ expiryDate: { $lt: now } }),
    Payment.aggregate([
      { $match: { paidAt: { $gte: startOfToday }, status: "success" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    Payment.aggregate([
      { $match: { paidAt: { $gte: startOfMonth }, status: "success" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    Payment.aggregate([
      { $match: { status: "success" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    Student.find().sort({ createdAt: -1 }).limit(5).select("name mobile seatNumber timing joiningDate"),
    Payment.find().sort({ paidAt: -1 }).limit(5).populate("student", "name seatNumber"),
  ]);

  const totalSeatsCount = totalSeats || 100;

  return ApiResponse.success(res, 200, "Dashboard stats fetched", {
    totalStudents,
    activeStudents,
    totalSeats: totalSeatsCount,
    // "occupied" = no shift left free on that seat; "available" = at least one shift still bookable
    occupiedSeats: fullyOccupiedSeats,
    availableSeats: totalSeatsCount - fullyOccupiedSeats,
    pendingFeeCount,
    todayAdmissions,
    expiringSoon,
    expiredMemberships,
    todayCollection: todayCollectionAgg[0]?.total || 0,
    monthlyCollection: monthlyCollectionAgg[0]?.total || 0,
    totalCollection: totalCollectionAgg[0]?.total || 0,
    recentStudents,
    recentPayments,
  });
});

// @desc    Get chart data (last 6 months revenue + admissions, shift-wise occupancy)
// @route   GET /api/dashboard/charts
// @access  Private
const getChartData = asyncHandler(async (req, res) => {
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const revenueByMonth = await Payment.aggregate([
    { $match: { paidAt: { $gte: sixMonthsAgo }, status: "success" } },
    {
      $group: {
        _id: { year: { $year: "$paidAt" }, month: { $month: "$paidAt" } },
        total: { $sum: "$amount" },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
  ]);

  const admissionsByMonth = await Student.aggregate([
    { $match: { joiningDate: { $gte: sixMonthsAgo } } },
    {
      $group: {
        _id: { year: { $year: "$joiningDate" }, month: { $month: "$joiningDate" } },
        count: { $sum: 1 },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
  ]);

  // Slot-level occupancy across all seats x all 4 shifts (max 400 slots for 100 seats).
  // This is what actually reflects "how full is each shift", unlike a single seat status.
  const seatsByStatus = await Seat.aggregate([
    { $project: { slotsArray: { $objectToArray: "$slots" } } },
    { $unwind: "$slotsArray" },
    { $group: { _id: "$slotsArray.v.status", count: { $sum: 1 } } },
  ]);

  // Occupied-slot breakdown per shift (morning/afternoon/evening/night) - useful for
  // seeing which shift is busiest.
  const occupancyByShift = await Seat.aggregate([
    { $project: { slotsArray: { $objectToArray: "$slots" } } },
    { $unwind: "$slotsArray" },
    { $match: { "slotsArray.v.status": "occupied" } },
    { $group: { _id: "$slotsArray.k", count: { $sum: 1 } } },
  ]);

  const paymentsByMode = await Payment.aggregate([
    { $match: { status: "success" } },
    { $group: { _id: "$mode", total: { $sum: "$amount" } } },
  ]);

  return ApiResponse.success(res, 200, "Chart data fetched", {
    revenueByMonth,
    admissionsByMonth,
    seatsByStatus,
    occupancyByShift,
    paymentsByMode,
  });
});

module.exports = { getStats, getChartData };
