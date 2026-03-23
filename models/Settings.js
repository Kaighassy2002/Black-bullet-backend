const mongoose = require("mongoose");

const { Schema } = mongoose;

const settingsSchema = new Schema(
  {
    workingHours: {
      start: {
        type: String,  
        trim: true,
        default: "09:00",
        match: [/^([01]\d|2[0-3]):([0-5]\d)$/, "Start time must be in HH:mm format"],
      },
      end: {
        type: String,
        trim: true,
        default: "18:00",
        match: [/^([01]\d|2[0-3]):([0-5]\d)$/, "End time must be in HH:mm format"],
      },
    },
    slotDuration: {
      type: Number,
      default: 30,
      min: [5, "Slot duration must be at least 5 minutes"],
      max: [180, "Slot duration cannot exceed 180 minutes"],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Settings", settingsSchema);
