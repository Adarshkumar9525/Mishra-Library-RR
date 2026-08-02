const express = require("express");
const router = express.Router();
const {
  getPayments,
  createPayment,
  deletePayment,
  getStudentPaymentHistory,
  getCollectionSummary,
} = require("../controllers/paymentController");
const { protect } = require("../middleware/auth");

router.use(protect);

router.route("/").get(getPayments).post(createPayment);
router.get("/summary", getCollectionSummary);
router.get("/student/:studentId", getStudentPaymentHistory);
router.delete("/:id", deletePayment);

module.exports = router;
