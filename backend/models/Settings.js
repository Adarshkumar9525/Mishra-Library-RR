const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema(
  {
    libraryName: { type: String, default: "Mishra Library" },
    tagline: { type: String, default: "Reading Room ERP" },
    logo: { type: String, default: "" },
    address: { type: String, default: "" },
    contactPhone: { type: String, default: "" },
    contactEmail: { type: String, default: "" },
    maxSeats: { type: Number, default: 100 },
    defaultMonthlyFee: { type: Number, default: 800 },
    openTime: { type: String, default: "06:00" },
    closeTime: { type: String, default: "22:00" },
    theme: { type: String, enum: ["light", "dark"], default: "light" },
  },
  { timestamps: true }
);

// Singleton pattern - only ever one settings document
module.exports = mongoose.model("Settings", settingsSchema);
