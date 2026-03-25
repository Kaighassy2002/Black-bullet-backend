const mongoose = require("mongoose");

const Booking = require("../models/Booking");

const ALLOWED_STATUS = new Set([
  "PENDING",
  "CONFIRMED",
  "IN-PROGRESS",
  "COMPLETED",
  "CANCELLED",
  "CRITICAL",
]);

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const normalizeString = (value) => (typeof value === "string" ? value.trim() : "");

const normalizeBookingStatus = (value) => {
  const raw = normalizeString(value);
  if (!raw) return "";

  // Accept admin UI values (e.g. "IN-PROGRESS") and older backend-style values
  // (e.g. "in_progress", "pending") by normalizing to the schema enum.
  const upper = raw.toUpperCase().replace(/_/g, "-");

  if (upper === "IN-PROGRESS" || upper === "IN PROGRESS") return "IN-PROGRESS";
  return upper;
};

const parseDateInput = (value, endOfDay = false) => {
  const raw = normalizeString(value);
  if (!raw) return null;

  // Accept YYYY-MM-DD by normalizing to UTC day boundaries.
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const d = new Date(`${raw}T00:00:00.000Z`);
    if (Number.isNaN(d.getTime())) return null;
    if (endOfDay) d.setUTCDate(d.getUTCDate() + 1);
    return d;
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;

  if (endOfDay) {
    const end = new Date(parsed);
    end.setUTCDate(end.getUTCDate() + 1);
    return end;
  }

  return parsed;
};

const listBookings = async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const status = normalizeBookingStatus(req.query.status);
    const dateStartRaw = req.query.dateStart;
    const dateEndRaw = req.query.dateEnd;

    const filters = {};

    if (status) {
      if (!ALLOWED_STATUS.has(status)) {
        const error = new Error("Invalid status filter");
        error.statusCode = 400;
        throw error;
      }
      filters.status = status;
    }

    const hasDateStart = normalizeString(dateStartRaw).length > 0;
    const hasDateEnd = normalizeString(dateEndRaw).length > 0;

    if (hasDateStart || hasDateEnd) {
      const preferredDate = {};

      if (hasDateStart) {
        const dateStart = parseDateInput(dateStartRaw, false);
        if (!dateStart) {
          const error = new Error("Invalid dateStart value");
          error.statusCode = 400;
          throw error;
        }
        preferredDate.$gte = dateStart;
      }

      if (hasDateEnd) {
        const dateEndExclusive = parseDateInput(dateEndRaw, true);
        if (!dateEndExclusive) {
          const error = new Error("Invalid dateEnd value");
          error.statusCode = 400;
          throw error;
        }
        preferredDate.$lt = dateEndExclusive;
      }

      filters.preferredDate = preferredDate;
    }

    const [bookings, total] = await Promise.all([
      Booking.find(filters)
        .sort({ preferredDate: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Booking.countDocuments(filters),
    ]);

    res.status(200).json({
      ok: true,
      data: bookings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

const getBookingById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      const error = new Error("Invalid booking id");
      error.statusCode = 400;
      throw error;
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      const error = new Error("Booking not found");
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({
      ok: true,
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

const updateBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      const error = new Error("Invalid booking id");
      error.statusCode = 400;
      throw error;
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      const error = new Error("Booking not found");
      error.statusCode = 404;
      throw error;
    }

    const hasStatus = Object.prototype.hasOwnProperty.call(req.body, "status");
    const hasNotes = Object.prototype.hasOwnProperty.call(req.body, "notes");

    if (!hasStatus && !hasNotes) {
      const error = new Error("At least one of status or notes is required");
      error.statusCode = 400;
      throw error;
    }

    if (hasStatus) {
      const status = normalizeBookingStatus(req.body.status);
      if (!ALLOWED_STATUS.has(status)) {
        const error = new Error("Invalid status value");
        error.statusCode = 400;
        throw error;
      }
      booking.status = status;
    }

    if (hasNotes) {
      booking.notes = normalizeString(req.body.notes);
    }

    await booking.save();

    res.status(200).json({
      ok: true,
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

const deleteBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      const error = new Error("Invalid booking id");
      error.statusCode = 400;
      throw error;
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      const error = new Error("Booking not found");
      error.statusCode = 404;
      throw error;
    }

    await Booking.deleteOne({ _id: booking._id });

    res.status(200).json({
      ok: true,
      message: "Booking deleted",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listBookings,
  getBookingById,
  updateBooking,
  deleteBooking,
};

