const mongoose = require("mongoose");

const { Schema } = mongoose;

const postSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, "Post title is required"],
      trim: true,
      minlength: [3, "Title must be at least 3 characters"],
      maxlength: [180, "Title cannot exceed 180 characters"],
    },
    slug: {
      type: String,
      required: [true, "Slug is required"],
      trim: true,
      lowercase: true,
      unique: true,
      match: [/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid slug format"],
      index: true,
    },
    category: {
      type: String,
      trim: true,
      maxlength: [120, "Category cannot exceed 120 characters"],
      index: true,
    },
    shortDesc: {
      type: String,
      trim: true,
      maxlength: [500, "Short description cannot exceed 500 characters"],
    },
    content: {
      type: String,
      required: [true, "Post content is required"],
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    featuredImage: {
      type: String,
      trim: true,
    },
    ogImage: {
      type: String,
      trim: true,
    },
    metaTitle: {
      type: String,
      trim: true,
      maxlength: [180, "Meta title cannot exceed 180 characters"],
    },
    metaDescription: {
      type: String,
      trim: true,
      maxlength: [320, "Meta description cannot exceed 320 characters"],
    },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
      index: true,
    },
    publishedAt: {
      type: Date,
      default: null,
      index: true,
    },
    views: {
      type: Number,
      default: 0,
      min: [0, "Views cannot be negative"],
    },
  },
  {
    timestamps: true,
  }
);

postSchema.index({ status: 1, publishedAt: -1 });
postSchema.index({ title: "text", shortDesc: "text", content: "text" });

module.exports = mongoose.model("Post", postSchema);
