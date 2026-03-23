const mongoose = require("mongoose");

const { Schema } = mongoose;

const bookingSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [120, "Name cannot exceed 120 characters"],
    },
    phone: {
      type: String,
      trim: true,
      minlength: [6, "Phone number is too short"],
      maxlength: [25, "Phone number is too long"],
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
      index: true,
    },
    carModel: {
      type: String,
      trim: true,
      maxlength: [120, "Car model cannot exceed 120 characters"],
    },
    vehicleType: {
      type: String,
      trim: true,
      maxlength: [80, "Vehicle type cannot exceed 80 characters"],
    },
    serviceId: {
      type: Schema.Types.ObjectId,
      ref: "Service",
      required: [true, "Service is required"],
      index: true,
    },
    date: {
      type: Date,
      required: [true, "Date is required"],
      index: true,
    },
    time: {
      type: String,
      required: [true, "Time is required"],
      trim: true,
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, "Time must be in HH:mm format"],
      index: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [2000, "Notes cannot exceed 2000 characters"],
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "in_progress", "completed", "cancelled"],
      default: "pending",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

bookingSchema.path("phone").validate(function validateContactPhone(value) {
  return Boolean(value || this.email);
}, "Either phone or email is required");

bookingSchema.path("email").validate(function validateContactEmail(value) {
  return Boolean(value || this.phone);
}, "Either email or phone is required");

bookingSchema.index({ date: 1, time: 1 }, { unique: true, name: "uniq_booking_slot" });
bookingSchema.index({ serviceId: 1, date: 1 });
bookingSchema.index({ status: 1, date: 1 });

module.exports = mongoose.model("Booking", bookingSchema);
