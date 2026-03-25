const express = require("express");

const {
  listBlogs,
  createBlog,
  getBlogById,
  updateBlog,
  deleteBlog,
} = require("../controllers/adminBlogController");
const { authenticateAdmin, requireRole } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authenticateAdmin);

router.get("/", requireRole("editor", "admin", "super_admin"), listBlogs);
router.post("/", requireRole("admin", "super_admin"), createBlog);
router.get("/:id", requireRole("editor", "admin", "super_admin"), getBlogById);
router.put("/:id", requireRole("admin", "super_admin"), updateBlog);
router.delete("/:id", requireRole("admin", "super_admin"), deleteBlog);

module.exports = router;

