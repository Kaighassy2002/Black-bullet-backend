const express = require("express");
const multer = require("multer");

const { authenticateAdmin, requireRole } = require("../middleware/authMiddleware");
const {
  listGalleryItems,
  createGalleryItem,
  deleteGalleryItem,
} = require("../controllers/adminGalleryController");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024,
  },
});

router.use(authenticateAdmin);

router.get("/", requireRole("editor", "admin", "super_admin"), listGalleryItems);
router.post(
  "/",
  requireRole("admin", "super_admin"),
  upload.single("file"),
  createGalleryItem
);
router.delete("/:id", requireRole("admin", "super_admin"), deleteGalleryItem);

module.exports = router;

