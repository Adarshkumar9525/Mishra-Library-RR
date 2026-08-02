const express = require("express");
const router = express.Router();
const {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  renewMembership,
} = require("../controllers/studentController");
const { protect } = require("../middleware/auth");

router.use(protect);

router.route("/").get(getStudents).post(createStudent);
router.route("/:id").get(getStudentById).put(updateStudent).delete(deleteStudent);
router.put("/:id/renew", renewMembership);

module.exports = router;
