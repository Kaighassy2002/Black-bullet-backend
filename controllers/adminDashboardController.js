const Booking = require("../models/Booking");

const statusSets = {
  pending: new Set(["PENDING", "pending"]),
  inProgress: new Set(["IN-PROGRESS", "in_progress", "IN PROGRESS", "in progress", "IN-PROGRESS"]),
  completed: new Set(["COMPLETED", "completed"]),
};

const normalizeStatus = (value) => {
  if (typeof value !== "string") return "";
  return value.trim().toUpperCase().replace(/_/g, "-").replace(/\s+/g, "-");
};

const statusLabel = (status) => {
  const s = normalizeStatus(status);
  if (s === "PENDING") return "Pending";
  if (s === "CONFIRMED") return "Confirmed";
  if (s === "IN-PROGRESS") return "In-Progress";
  if (s === "COMPLETED") return "Completed";
  if (s === "CANCELLED") return "Cancelled";
  if (s === "CRITICAL") return "Critical";
  return status || "";
};

const formatDateLabel = (date) => {
  if (!date) return "";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";

  // Example: "Oct 24, 2023"
  return d.toLocaleString("en-US", { month: "short", day: "2-digit", year: "numeric" });
};

const monthShortLabel = (date) =>
  new Date(date).toLocaleString("en-US", { month: "short" });

const getRange = (startDate, endDate) => ({
  $gte: startDate,
  $lt: endDate,
});

const getDashboard = async (_req, res, next) => {
  try {
    const now = new Date();

    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const totalBookings = await Booking.countDocuments({});

    const pendingBookings = await Booking.countDocuments({
      status: { $in: Array.from(statusSets.pending) },
    });

    const completedBookings = await Booking.countDocuments({
      status: { $in: Array.from(statusSets.completed) },
    });

    // New enquiries = created in last 30 days
    const newEnquiries = await Booking.countDocuments({
      createdAt: getRange(thirtyDaysAgo, now),
    });
    const newEnquiriesPending = await Booking.countDocuments({
      createdAt: getRange(thirtyDaysAgo, now),
      status: { $in: Array.from(statusSets.pending) },
    });

    // Change% = compare bookings created in last 30 days vs previous 30 days
    const prevRangeCount = await Booking.countDocuments({
      createdAt: getRange(sixtyDaysAgo, thirtyDaysAgo),
    });
    const changePct =
      prevRangeCount === 0 ? 0 : Math.round(((newEnquiries - prevRangeCount) / prevRangeCount) * 100);

    // Booking velocity = preferredDate counts over last 6 months.
    // Each bar: prev = same month last year, curr = this year.
    const monthCursor = new Date(now.getFullYear(), now.getMonth(), 1);
    const rawSeries = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(monthCursor.getFullYear(), monthCursor.getMonth() - i, 1);
      const startCurr = new Date(d.getFullYear(), d.getMonth(), 1);
      const endCurr = new Date(d.getFullYear(), d.getMonth() + 1, 1);

      const startPrev = new Date(d.getFullYear() - 1, d.getMonth(), 1);
      const endPrev = new Date(d.getFullYear() - 1, d.getMonth() + 1, 1);

      const [prevCount, currCount] = await Promise.all([
        Booking.countDocuments({ preferredDate: getRange(startPrev, endPrev) }),
        Booking.countDocuments({ preferredDate: getRange(startCurr, endCurr) }),
      ]);

      rawSeries.push({
        label: monthShortLabel(d),
        prevCount,
        currCount,
      });
    }

    // Frontend treats `prev` and `curr` as percent heights (0..100).
    const maxCount = Math.max(
      1,
      ...rawSeries.flatMap((x) => [x.prevCount || 0, x.currCount || 0])
    );

    const series = rawSeries.map((x) => ({
      label: x.label,
      prev: Math.round(((x.prevCount || 0) / maxCount) * 100),
      curr: Math.round(((x.currCount || 0) / maxCount) * 100),
    }));

    // Live stats are approximate because there is no explicit technician model.
    const serviceQueue = await Booking.countDocuments({
      status: { $in: Array.from(statusSets.pending).concat(Array.from(statusSets.inProgress)) },
      preferredDate: { $gte: now },
    });

    const techniciansTotal = 10;
    const techniciansActive = Math.min(
      techniciansTotal,
      Math.max(0, Math.ceil(serviceQueue / 2))
    );
    const utilizationPct =
      techniciansTotal === 0 ? 0 : Math.min(100, Math.round((techniciansActive / techniciansTotal) * 100));

    const serviceQueueStatusLabel = utilizationPct >= 80 ? "At Capacity" : "In Progress";
    const revenueVelocityLabel = pendingBookings > completedBookings ? "High Performance" : "Steady Flow";

    const recentBookingsRaw = await Booking.find({})
      .sort({ preferredDate: -1, createdAt: -1 })
      .limit(5)
      .select(
        "customerName vehicleType serviceType status preferredDate preferredTime vehicleDetails createdAt"
      )
      .lean();

    const recentBookings = recentBookingsRaw.map((b) => {
      const vehicleModel = b.vehicleDetails?.model ? ` - ${b.vehicleDetails.model}` : "";
      const vehicle = `${b.vehicleType || ""}${vehicleModel}`.trim();

      const shortId = b._id?.toString?.().slice(-4).toUpperCase() || "";
      return {
        id: shortId ? `#BB-${shortId}` : b._id?.toString?.() || "",
        // Match frontend dashboard key names
        client: b.customerName || "",
        vehicle,
        vehicleColor: null,
        service: b.serviceType || "",
        status: statusLabel(b.status),
        statusRaw: normalizeStatus(b.status) || "",
        date: formatDateLabel(b.preferredDate),
        scheduledAt: b.preferredDate || null,
      };
    });

    res.status(200).json({
      ok: true,
      data: {
        metrics: {
          totalBookings,
          pendingBookings,
          completedBookings,
          changePct,
          newEnquiries,
          newEnquiriesPending,
          revenueVelocityLabel,
        },
        bookingVelocity: {
          series,
        },
        liveStats: {
          serviceQueue,
          serviceQueueStatusLabel,
          techniciansActive,
          techniciansTotal,
          utilizationPct,
        },
        recentBookings,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboard,
};

