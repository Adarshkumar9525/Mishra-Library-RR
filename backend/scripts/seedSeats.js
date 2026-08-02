// Run with: npm run seed:seats
require("dotenv").config();
const connectDB = require("../config/db");
const Seat = require("../models/Seat");

const MAX_SEATS = Number(process.env.MAX_SEATS) || 100;

const emptySlot = () => ({ status: "available", student: null });

const seedSeats = async () => {
  await connectDB();

  const existingCount = await Seat.countDocuments();
  if (existingCount > 0) {
    console.log(`Seats already exist (${existingCount}). Skipping seed to avoid duplicates.`);
    process.exit(0);
  }

  const seats = [];
  for (let i = 1; i <= MAX_SEATS; i++) {
    seats.push({
      seatNumber: i,
      slots: {
        morning: emptySlot(),
        afternoon: emptySlot(),
        evening: emptySlot(),
        night: emptySlot(),
      },
    });
  }

  await Seat.insertMany(seats);
  console.log(`Successfully seeded ${MAX_SEATS} seats, each with 4 independent shift slots (morning/afternoon/evening/night).`);
  process.exit(0);
};

seedSeats().catch((err) => {
  console.error(err);
  process.exit(1);
});
