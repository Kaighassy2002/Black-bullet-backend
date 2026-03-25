const express = require("express");

const {
  listServices,
  createService,
  getServiceById,
  updateService,
  deleteService,
} = require("../controllers/adminServicesController");
const { authenticateAdmin, requireRole } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authenticateAdmin);

router.get("/", requireRole("editor", "admin", "super_admin"), listServices);
router.post("/", requireRole("admin", "super_admin"), createService);
router.get("/:id", requireRole("editor", "admin", "super_admin"), getServiceById);
router.put("/:id", requireRole("admin", "super_admin"), updateService);
router.delete("/:id", requireRole("admin", "super_admin"), deleteService);

module.exports = router;
