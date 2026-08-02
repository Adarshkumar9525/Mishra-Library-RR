const express = require("express");
const router = express.Router();
const { getSeats, getSeatById, checkAvailability, updateSeatStatus, transferSeat } = require("../controllers/seatController");
const { protect } = require("../middleware/auth");

router.use(protect);

router.get("/", getSeats);
router.get("/:seatNumber/availability", checkAvailability);
router.get("/:id", getSeatById);
router.put("/:id/status", updateSeatStatus);
router.put("/transfer", transferSeat);

module.exports = router;
