const Booking = require("../models/Booking");

// Keep these mappings aligned with the frontend BookingForm options.
const vehicleTypes = [
  { label: "Supercar / Exotic" },
  { label: "Hyper Performance" },
  { label: "Custom Build" },
];

const serviceProtocols = [
  { label: "ECU STAGE 2 REMAP" },
  { label: "CARBON AERO FIT" },
];

const days = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const dates = [12, 13, 14, 15, 16, 17, 18];

const timeSlots = ["09:00 AM", "11:30 AM", "02:00 PM", "04:30 PM"];

const normalizeString = (value) => (typeof value === "string" ? value.trim() : "");

const parseTimeSlot = (timeSlot) => {
  const raw = normalizeString(timeSlot);
  const match = raw.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const meridiem = match[3].toUpperCase();

  if (meridiem === "AM") {
    if (hours === 12) hours = 0;
  } else if (meridiem === "PM") {
    if (hours !== 12) hours += 12;
  }

  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  return { hours, minutes };
};

const parseDateLabel = (value) => {
  const raw = normalizeString(value).toUpperCase();
  if (!raw) return null;

  // Accept values like "FRI 15" or "FRI, 15"
  const match = raw.match(/^(MON|TUE|WED|THU|FRI|SAT|SUN)\s*,?\s*(\d{1,2})$/);
  if (!match) return null;

  return {
    day: match[1],
    dateNumber: Number(match[2]),
  };
};

const computePreferredDate = ({ dateNumber, timeSlot }) => {
  const time = parseTimeSlot(timeSlot);
  if (!time) return null;

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-11

  // Assume the selected day-of-month refers to the current month if it's still in the future,
  // otherwise assume it's the next month.
  let candidate = new Date(year, month, dateNumber, time.hours, time.minutes, 0, 0);
  if (candidate.getTime() < now.getTime()) {
    candidate = new Date(year, month + 1, dateNumber, time.hours, time.minutes, 0, 0);
  }
  return candidate;
};

const createBooking = async (req, res, next) => {
  try {
    const {
      // Frontend fields
      name,
      email,
      model,
      vehicleType,
      vehicleTypeIndex,
      serviceType,
      serviceTypeIndex,
      preferredDay,
      preferredDateNumber,
      preferredDateIndex,
      preferredDateLabel,
      preferredDate: preferredDateInput,
      preferredTime,
      preferredTimeIndex,
      notes,
    } = req.body || {};

    const resolvedVehicleType =
      normalizeString(vehicleType) ||
      (Number.isInteger(Number(vehicleTypeIndex)) &&
        vehicleTypes[Number(vehicleTypeIndex)]?.label);

    const resolvedServiceType =
      normalizeString(serviceType) ||
      (Number.isInteger(Number(serviceTypeIndex)) &&
        serviceProtocols[Number(serviceTypeIndex)]?.label);

    let resolvedPreferredDay = normalizeString(preferredDay);
    let resolvedPreferredDateNumber =
      typeof preferredDateNumber === "number"
        ? preferredDateNumber
        : Number.isInteger(Number(preferredDateNumber)) && preferredDateNumber !== undefined
          ? Number(preferredDateNumber)
          : null;

    if (!resolvedPreferredDateNumber && preferredDateIndex !== undefined) {
      const idx = Number(preferredDateIndex);
      if (Number.isInteger(idx) && idx >= 0 && idx < dates.length) {
        resolvedPreferredDay = days[idx];
        resolvedPreferredDateNumber = dates[idx];
      }
    }

    // Accept direct date labels in payload (e.g. from Postman): preferredDate: "FRI 15"
    if (!resolvedPreferredDateNumber && preferredDateInput !== undefined) {
      const parsed = parseDateLabel(preferredDateInput);
      if (parsed) {
        resolvedPreferredDay = parsed.day;
        resolvedPreferredDateNumber = parsed.dateNumber;
      }
    }

    const resolvedPreferredDateLabel =
      normalizeString(preferredDateLabel) ||
      (resolvedPreferredDay && resolvedPreferredDateNumber
        ? `${resolvedPreferredDay} ${resolvedPreferredDateNumber}`
        : "");

    const resolvedPreferredTime =
      normalizeString(preferredTime) ||
      (Number.isInteger(Number(preferredTimeIndex)) &&
        timeSlots[Number(preferredTimeIndex)]?.toString());

    if (!normalizeString(name)) {
      const error = new Error("Customer name is required");
      error.statusCode = 400;
      throw error;
    }
    if (!normalizeString(email)) {
      const error = new Error("Email is required");
      error.statusCode = 400;
      throw error;
    }
    if (!normalizeString(model)) {
      const error = new Error("Vehicle model is required");
      error.statusCode = 400;
      throw error;
    }
    if (!resolvedVehicleType) {
      const error = new Error("Vehicle type is required");
      error.statusCode = 400;
      throw error;
    }
    if (!resolvedServiceType) {
      const error = new Error("Service type is required");
      error.statusCode = 400;
      throw error;
    }
    if (!resolvedPreferredDateNumber) {
      const error = new Error("Preferred date is required");
      error.statusCode = 400;
      throw error;
    }
    if (!resolvedPreferredTime) {
      const error = new Error("Preferred time is required");
      error.statusCode = 400;
      throw error;
    }

    const preferredDate = computePreferredDate({
      dateNumber: resolvedPreferredDateNumber,
      timeSlot: resolvedPreferredTime,
    });
    if (!preferredDate) {
      const error = new Error("Invalid preferred date/time");
      error.statusCode = 400;
      throw error;
    }

    const booking = await Booking.create({
      // Schema uses `customerName` with alias `name`
      name: normalizeString(name),
      email: normalizeString(email),

      // Matches frontend selection labels
      vehicleType: resolvedVehicleType,
      serviceType: resolvedServiceType,

      // Schedule details
      preferredDate,
      preferredTime: resolvedPreferredTime,
      preferredDateLabel: resolvedPreferredDateLabel,
      preferredDay: resolvedPreferredDay,
      preferredDateNumber: resolvedPreferredDateNumber,

      // Frontend `model` input goes into vehicleDetails.model
      vehicleDetails: { model: normalizeString(model) },

      notes: normalizeString(notes),
    });

    res.status(201).json({
      ok: true,
      data: booking,
    });
  } catch (error) {
    if (error?.name === "ValidationError") {
      error.statusCode = 400;
    }
    next(error);
  }
};

module.exports = {
  createBooking,
};

