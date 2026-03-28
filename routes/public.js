const express = require("express");

const {
  getPublicContentByPageKey,
  listPublicBlogs,
  getPublicBlogBySlugOrId,
  listPublicServices,
  getPublicServiceBySlugOrId,
  listPublicGalleryItems,
} = require("../controllers/publicController");

const router = express.Router();

router.get("/content/:pageKey", getPublicContentByPageKey);
router.get("/blog", listPublicBlogs);
router.get("/blog/:slugOrId", getPublicBlogBySlugOrId);
router.get("/services", listPublicServices);
router.get("/services/:idOrSlug", getPublicServiceBySlugOrId);
router.get("/gallery", listPublicGalleryItems);

module.exports = router;
