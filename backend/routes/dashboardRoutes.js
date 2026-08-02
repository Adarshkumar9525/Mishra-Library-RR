const express = require("express");
const router = express.Router();
const { getStats, getChartData } = require("../controllers/dashboardController");
const { protect } = require("../middleware/auth");

router.use(protect);

router.get("/stats", getStats);
router.get("/charts", getChartData);

module.exports = router;
