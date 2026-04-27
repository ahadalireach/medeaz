const Doctor = require('../../models/Doctor');
const Prescription = require('../../models/Prescription');
const Appointment = require('../../models/Appointment');
const RevenueEntry = require('../../models/RevenueEntry');
const User = require('../../models/User');
const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const ApiError = require('../../utils/ApiError');
const { reverseRevenueEntry } = require('../../utils/revenue');

/**
 * @desc    Get doctor's revenue statistics with periodicity
 * @route   GET /api/doctor/revenue
 * @access  Private (Doctor only)
 */
exports.getRevenue = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findOne({ userId: req.user._id });
  const { period = "month" } = req.query; // period: day, month, year

  if (!doctor) {
    throw new ApiError(404, "Doctor profile not found");
  }

  // Guard: revenue may be undefined for old documents created before the field existed
  const revenue = doctor.revenue || { total: 0, monthly: new Map(), daily: new Map() };
  const monthlyMap = revenue.monthly instanceof Map ? revenue.monthly : new Map();
  const dailyMap   = revenue.daily   instanceof Map ? revenue.daily   : new Map();

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const thisMonthRevenue = monthlyMap.get(currentMonth) || 0;

  // Convert Map to plain object for JSON response
  const monthlyRevenueObj = {};
  monthlyMap.forEach((value, key) => {
    monthlyRevenueObj[key] = value;
  });

  const dailyRevenueObj = {};
  dailyMap.forEach((value, key) => {
    dailyRevenueObj[key] = value;
  });

  // Generate trend data based on period
  const revenueData = [];
  const currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0); // Normalize to start of day

  if (period === "year") {
    // Show the current calendar year (Jan -> Dec) in chronological order.
    const year = currentDate.getFullYear();
    for (let month = 0; month < 12; month++) {
      const date = new Date(year, month, 1);
      const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
      revenueData.push({
        label: date.toLocaleString('default', { month: 'short' }),
        date: monthKey,
        revenue: monthlyRevenueObj[monthKey] || 0
      });
    }
  } else if (period === "month") {
    // Show the full current month from day 1 to month end.
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dayKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

      revenueData.push({
        label: date.getDate().toString(),
        date: dayKey,
        revenue: dailyRevenueObj[dayKey] || 0
      });
    }
  } else if (period === "week" || period === "day") {
    // Show last 7 days in chronological order.
    for (let i = 6; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - i);
      const dayKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      
      const label = date.toLocaleDateString('en-US', { weekday: 'short' });

      revenueData.push({
        date: dayKey,
        label: label,
        revenue: dailyRevenueObj[dayKey] || 0
      });
    }
  }

  res.status(200).json(new ApiResponse(200, {
    total: revenue.total || 0,
    monthly: monthlyRevenueObj,
    thisMonth: thisMonthRevenue,
    chartData: revenueData
  }, 'Revenue analytics fetched successfully'));
});

/**
 * @desc    Get revenue by date range
 * @route   GET /api/doctor/revenue/range
 * @access  Private (Doctor only)
 */
exports.getRevenueByRange = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  const filter = {
    doctorId: req.user._id,
    status: 'completed',
    dateTime: {}
  };

  if (startDate) {
    filter.dateTime.$gte = new Date(startDate);
  }
  if (endDate) {
    filter.dateTime.$lte = new Date(endDate);
  }

  const Appointment = require('../../models/Appointment');
  const appointments = await Appointment.find(filter);
  const doctor = await Doctor.findOne({ userId: req.user._id });

  const fee = doctor?.consultationFee || 0;
  const totalRevenue = appointments.length * (fee * 0.8);

  res.status(200).json(new ApiResponse(200, {
    totalRevenue,
    count: appointments.length,
    startDate,
    endDate
  }, 'Revenue by range fetched successfully'));
});

exports.getRevenueHistory = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const [entries, total] = await Promise.all([
    RevenueEntry.find({ doctorUserId: req.user._id })
      .sort({ occurredAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('patientUserId', 'name email')
      .lean(),
    RevenueEntry.countDocuments({ doctorUserId: req.user._id }),
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

exports.deleteRevenueHistoryRecord = asyncHandler(async (req, res) => {
  const record = await RevenueEntry.findOne({
    _id: req.params.id,
    doctorUserId: req.user._id,
  });

  if (!record) {
    throw new ApiError(404, 'Revenue history record not found');
  }

  await reverseRevenueEntry(record);
  await RevenueEntry.deleteOne({ _id: record._id });

  res.status(200).json(new ApiResponse(200, null, 'Revenue history record deleted successfully'));
});

exports.clearRevenueHistory = asyncHandler(async (req, res) => {
  const records = await RevenueEntry.find({ doctorUserId: req.user._id });

  for (const record of records) {
    await reverseRevenueEntry(record);
  }

  await RevenueEntry.deleteMany({ doctorUserId: req.user._id });

  res.status(200).json(new ApiResponse(200, null, 'Revenue history cleared successfully'));
});

module.exports = exports;
