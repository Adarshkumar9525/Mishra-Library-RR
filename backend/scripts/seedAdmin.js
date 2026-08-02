// Run with: npm run seed:admin
// Edit the values below before running, then delete/change the password after first login.
require("dotenv").config();
const connectDB = require("../config/db");
const Admin = require("../models/Admin");

const seedAdmin = async () => {
  await connectDB();

  const existing = await Admin.findOne({ email: "admin@mishralibrary.com" });
  if (existing) {
    console.log("Admin already exists with this email. Skipping.");
    process.exit(0);
  }

  const admin = await Admin.create({
    name: "Mishra Library Admin",
    email: "admin@mishralibrary.com",
    password: "ChangeMe123!", // CHANGE THIS after first login
    role: "superadmin",
  });

  console.log(`Admin created: ${admin.email} (password: ChangeMe123! - change immediately)`);
  process.exit(0);
};

seedAdmin().catch((err) => {
  console.error(err);
  process.exit(1);
});
