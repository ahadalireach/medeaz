const Analytics = require("../../models/Analytics");
const Appointment = require("../../models/Appointment");
const Clinic = require("../../models/Clinic");
const asyncHandler = require("../../utils/asyncHandler");
const ApiError = require("../../utils/ApiError");
const ApiResponse = require("../../utils/ApiResponse");

exports.getOverview = asyncHandler(async (req, res) => {
  const clinicId = req.user.clinicId;

  if (!clinicId) {
    throw new ApiError(404, "Clinic not found for this user");
  }

  const clinic = await Clinic.findById(clinicId).populate("doctors");

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const doctorUserIds = clinic.doctors.map((d) => d.userId).filter(Boolean);

  const todayQuery = {
    clinicId: clinicId,
    deletedByClinic: { $ne: true },
    $or: [
      { dateTime: { $gte: today, $lt: tomorrow } },
      { completedAt: { $gte: today, $lt: tomorrow } }
    ]
  };

  const todayAppointments = await Appointment.countDocuments(todayQuery);

  const todayPatients = await Appointment.distinct("patientId", todayQuery);

  // Get today's revenue (20% clinic share) directly from the clinic's daily revenue map
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const todayRevenue = clinic.revenue?.daily?.get(todayKey) || 0;

  // Get current month revenue from clinic model
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const monthlyRevenue = clinic.revenue?.monthly?.get(currentMonth) || 0;

  const activeDoctors = clinic.doctors.length;

  res.status(200).json(
    new ApiResponse(200, {
      todayPatients: todayPatients.length,
      totalAppointments: todayAppointments,
      activeDoctors,
      todayRevenue,
      revenue: clinic.revenue?.total || 0,
      monthlyRevenue: monthlyRevenue,
    })
  );
});

exports.getPatientFlow = asyncHandler(async (req, res) => {
  const clinicId = req.user.clinicId;
  const Doctor = require("../../models/Doctor"); // Ensure model is available

  if (!clinicId) {
    throw new ApiError(404, "Clinic not found for this user");
  }

  const currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0); // Normalize to start of day
  const endDate = new Date(currentDate);
  endDate.setDate(endDate.getDate() + 15);
  endDate.setHours(23, 59, 59, 999);

  const patientFlow = await Appointment.aggregate([
    {
      $match: {
        clinicId: clinicId,
        dateTime: { $gte: currentDate, $lte: endDate },
        status: 'completed',
        deletedByClinic: { $ne: true }
      },
    },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$dateTime" },
        },
        count: { $sum: 1 },
        uniquePatients: { $addToSet: "$patientId" },
      },
    },
    {
      $project: {
        date: "$_id",
        label: { $dayOfMonth: { $toDate: "$_id" } },
        patients: { $size: "$uniquePatients" },
      },
    },
    {
      $sort: { date: 1 },
    },
  ]);

  // Fill in gaps
  const filledFlow = [];

  for (let i = 0; i <= 15; i++) {
    const date = new Date(currentDate);
    date.setDate(currentDate.getDate() + i);
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const existing = patientFlow.find(f => f.date === dateStr);

    filledFlow.push({
      date: dateStr,
      label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      patients: existing ? existing.patients : 0
    });
  }

  res.status(200).json(new ApiResponse(200, filledFlow));
});

exports.getRevenue = asyncHandler(async (req, res) => {
  const clinicId = req.user.clinicId;
  const { period = "month" } = req.query;

  if (!clinicId) {
    throw new ApiError(404, "Clinic not found for this user");
  }

  const clinic = await Clinic.findById(clinicId);

  // Convert Map to object for response
  const monthlyRevenue = {};
  if (clinic.revenue && clinic.revenue.monthly) {
    clinic.revenue.monthly.forEach((value, key) => {
      monthlyRevenue[key] = value;
    });
  }

  // Convert daily Map to object for response
  const dailyRevenue = {};
  if (clinic.revenue && clinic.revenue.daily) {
    clinic.revenue.daily.forEach((value, key) => {
      dailyRevenue[key] = value;
    });
  }

  // Get last 12 months data or filter by period
  const currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0); // Normalize to start of day
  const revenueData = [];

  if (period === "year") {
    // Show last 12 months (oldest -> newest)
    for (let i = 11; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      revenueData.push({
        date: monthKey,
        label: date.toLocaleString('default', { month: 'short' }),
        revenue: monthlyRevenue[monthKey] || 0
      });
    }
  } else if (period === "month") {
    // Show last 30 days (oldest -> newest)
    for (let i = 29; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - i);
      const dayKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      
      revenueData.push({
        date: dayKey,
        label: date.getDate().toString(),
        revenue: dailyRevenue[dayKey] || 0
      });
    }
  } else if (period === "week" || period === "day") {
    // Show last 7 days (oldest -> newest)
    for (let i = 6; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - i);
      const dayKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      
      const label = date.toLocaleDateString('en-US', { weekday: 'short' });

      revenueData.push({
        date: dayKey,
        label: label,
        revenue: dailyRevenue[dayKey] || 0
      });
    }
  }

  res.status(200).json(
    new ApiResponse(200, {
      data: revenueData,
      total: clinic.revenue?.total || 0,
      currentMonth: monthlyRevenue[currentDate.toISOString().slice(0, 7)] || 0
    })
  );
});

exports.getRevenueHistory = asyncHandler(async (req, res) => {
  const clinicId = req.user.clinicId;
  const RevenueEntry = require('../../models/RevenueEntry');
  const { page = 1, limit = 20 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  if (!clinicId) {
    throw new ApiError(404, "Clinic not found for this user");
  }

  const [entries, total] = await Promise.all([
    RevenueEntry.find({ clinicId: clinicId })
      .sort({ occurredAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('doctorUserId', 'name email')
      .populate('patientUserId', 'name email')
      .lean(),
    RevenueEntry.countDocuments({ clinicId: clinicId }),
  ]);

  res.status(200).json(new ApiResponse(200, {
    entries,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit)),
    },
  }, 'Revenue history fetched successfully'));
});

/**
 * @desc    Delete a specific revenue history record for clinic
 * @route   DELETE /api/clinic/analytics/revenue/history/:id
 * @access  Private (Clinic Admin only)
 */
exports.deleteRevenueHistoryRecord = asyncHandler(async (req, res) => {
  const clinicId = req.user.clinicId;
  const RevenueEntry = require('../../models/RevenueEntry');

  if (!clinicId) {
    throw new ApiError(404, "Clinic not found for this user");
  }

  const record = await RevenueEntry.findOne({
    _id: req.params.id,
    clinicId: clinicId,
  });

  if (!record) {
    throw new ApiError(404, 'Revenue history record not found');
  }

  const { reverseRevenueEntry } = require('../../utils/revenue');
  await reverseRevenueEntry(record);
  await RevenueEntry.deleteOne({ _id: record._id });

  res.status(200).json(new ApiResponse(200, null, 'Revenue history record deleted successfully'));
});

/**
 * @desc    Clear all revenue history records for clinic
 * @route   DELETE /api/clinic/analytics/revenue/history
 * @access  Private (Clinic Admin only)
 */
exports.clearRevenueHistory = asyncHandler(async (req, res) => {
  const clinicId = req.user.clinicId;
  const RevenueEntry = require('../../models/RevenueEntry');

  if (!clinicId) {
    throw new ApiError(404, "Clinic not found for this user");
  }

  const records = await RevenueEntry.find({ clinicId: clinicId });

  const { reverseRevenueEntry } = require('../../utils/revenue');
  for (const record of records) {
    await reverseRevenueEntry(record);
  }

  await RevenueEntry.deleteMany({ clinicId: clinicId });

  res.status(200).json(new ApiResponse(200, null, 'Revenue history cleared successfully'));
});
