const express = require("express");

const {
  listBookings,
  getBookingById,
  updateBooking,
  deleteBooking,
} = require("../controllers/adminBookingsController");
const { authenticateAdmin, requireRole } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authenticateAdmin);

router.get("/", requireRole("editor", "admin", "super_admin"), listBookings);
router.get("/:id", requireRole("editor", "admin", "super_admin"), getBookingById);
router.put("/:id", requireRole("admin", "super_admin"), updateBooking);
router.delete("/:id", requireRole("admin", "super_admin"), deleteBooking);

module.exports = router;

