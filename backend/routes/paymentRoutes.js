const express = require("express");
const router = express.Router();
const {
  getPayments,
  createPayment,
  updatePayment,
  deletePayment,
  getStudentPaymentHistory,
  getCollectionSummary,
} = require("../controllers/paymentController");
const { protect } = require("../middleware/auth");

router.use(protect);

router.route("/").get(getPayments).post(createPayment);
router.get("/summary", getCollectionSummary);
router.get("/student/:studentId", getStudentPaymentHistory);
router.route("/:id").put(updatePayment).delete(deletePayment);

module.exports = router;
