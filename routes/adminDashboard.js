const express = require("express");

const { authenticateAdmin, requireRole } = require("../middleware/authMiddleware");
const { getDashboard } = require("../controllers/adminDashboardController");

const router = express.Router();

router.use(authenticateAdmin);

router.get("/", requireRole("editor", "admin", "super_admin"), getDashboard);

module.exports = router;

