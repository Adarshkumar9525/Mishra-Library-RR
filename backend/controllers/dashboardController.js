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
  const utcStartOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
  const localStartOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  localStartOfToday.setHours(0, 0, 0, 0);
  const startOfToday = new Date(Math.min(utcStartOfToday.getTime(), localStartOfToday.getTime()));

  const utcStartOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
  const localStartOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  localStartOfMonth.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(Math.min(utcStartOfMonth.getTime(), localStartOfMonth.getTime()));

  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const currentMonthStr = now.toISOString().slice(0, 7);

  const [
    totalStudents,
    activeStudents,
    seatStatsAgg,
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
    Seat.aggregate([
      {
        $project: {
          occupiedCount: {
            $size: {
              $filter: {
                input: [
                  "$slots.morning.status",
                  "$slots.afternoon.status",
                  "$slots.evening.status",
                  "$slots.night.status",
                ],
                as: "st",
                cond: { $eq: ["$$st", "occupied"] },
              },
            },
          },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          fullyOccupied: {
            $sum: { $cond: [{ $eq: ["$occupiedCount", 4] }, 1, 0] },
          },
          partiallyOccupied: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $gte: ["$occupiedCount", 1] },
                    { $lt: ["$occupiedCount", 4] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          fullyAvailable: {
            $sum: { $cond: [{ $eq: ["$occupiedCount", 0] }, 1, 0] },
          },
        },
      },
    ]),
    Student.countDocuments({ feeStatus: { $in: ["due", "partial"] } }),
    Student.countDocuments({ joiningDate: { $gte: startOfToday } }),
    Student.countDocuments({ expiryDate: { $gte: now, $lte: sevenDaysFromNow } }),
    Student.countDocuments({ expiryDate: { $lt: now } }),
    Payment.aggregate([
      { $match: { paidAt: { $gte: startOfToday }, status: "success" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    Payment.aggregate([
      {
        $match: {
          $or: [
            { paidAt: { $gte: startOfMonth } },
            { forMonth: currentMonthStr }
          ],
          status: "success"
        }
      },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    Payment.aggregate([
      { $match: { status: "success" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    Student.find().sort({ createdAt: -1 }).limit(5).select("name mobile seatNumber timing joiningDate").lean(),
    Payment.find().sort({ paidAt: -1 }).limit(5).populate("student", "name seatNumber").lean(),
  ]);

  const seatStats = seatStatsAgg[0] || { total: 100, fullyOccupied: 0, partiallyOccupied: 0, fullyAvailable: 100 };
  const totalSeatsCount = seatStats.total || 100;
  const fullyOccupied = seatStats.fullyOccupied || 0;
  const partiallyOccupied = seatStats.partiallyOccupied || 0;
  const fullyAvailable = seatStats.fullyAvailable || 0;

  return ApiResponse.success(res, 200, "Dashboard stats fetched", {
    totalStudents,
    activeStudents,
    totalSeats: totalSeatsCount,
    occupiedSeats: fullyOccupied,
    fullyOccupiedSeats: fullyOccupied,
    partiallyOccupiedSeats: partiallyOccupied,
    availableSeats: fullyAvailable,
    fullyAvailableSeats: fullyAvailable,
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

  const seatsByStatus = await Seat.aggregate([
    { $project: { slotsArray: { $objectToArray: "$slots" } } },
    { $unwind: "$slotsArray" },
    { $group: { _id: "$slotsArray.v.status", count: { $sum: 1 } } },
  ]);

  // Occupied-slot breakdown per shift (morning/afternoon/evening/night)
  const rawShiftOccupancy = await Seat.aggregate([
    { $project: { slotsArray: { $objectToArray: "$slots" } } },
    { $unwind: "$slotsArray" },
    { $match: { "slotsArray.v.status": "occupied" } },
    { $group: { _id: "$slotsArray.k", count: { $sum: 1 } } },
  ]);

  const ALL_SHIFTS = ["morning", "afternoon", "evening", "night"];
  const shiftMap = rawShiftOccupancy.reduce((acc, curr) => {
    acc[curr._id] = curr.count;
    return acc;
  }, {});

  // Always return all 4 shifts, defaulting missing ones to 0
  const occupancyByShift = ALL_SHIFTS.map((shift) => ({
    shift,
    _id: shift,
    count: shiftMap[shift] || 0,
  }));

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
