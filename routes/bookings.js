const express = require("express");

const { createBooking } = require("../controllers/bookingsController");

const router = express.Router();

// Public booking creation endpoint (no admin auth required).
router.post("/", createBooking);

module.exports = router;

