const Doctor = require('../../models/Doctor');
const Appointment = require('../../models/Appointment');
const redis = require('../../config/redis');
const { invalidateAllDoctorScheduleCaches } = require('../../utils/cacheHelpers');
const asyncHandler = require('../../utils/asyncHandler');
const ApiError = require('../../utils/ApiError');
const ApiResponse = require('../../utils/ApiResponse');

/**
 * @desc    Get weekly doctor schedule and appointments
 * @route   GET /api/doctor/schedule/week
 * @access  Private (Doctor only)
 */
exports.getWeeklySchedule = asyncHandler(async (req, res) => {
  const doctorProfile = await Doctor.findOne({ userId: req.user._id });
  if (!doctorProfile) throw new ApiError(404, 'Doctor profile not found');

  const targetDate = req.query.date ? new Date(req.query.date) : new Date();
  
  // Find Monday
  const dayOfWeek = targetDate.getDay();
  const diffToMonday = targetDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  const weekStart = new Date(targetDate.setDate(diffToMonday));
  weekStart.setHours(0, 0, 0, 0);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  const weekStartStr = weekStart.toISOString().split('T')[0];
  const cacheKey = `schedule:${req.user._id.toString()}:${weekStartStr}`;

  const cachedData = await redis.get(cacheKey);
  if (cachedData) {
    return res.status(200).json(new ApiResponse(200, JSON.parse(cachedData), 'Schedule fetched from cache'));
  }

  const appointments = await Appointment.find({
    doctorId: req.user._id,
    dateTime: { $gte: weekStart, $lte: weekEnd },
    status: { $in: ['pending', 'confirmed', 'completed', 'cancelled', 'no-show', 'in-progress'] }
  }).populate('patientId', 'name photo email');

  const dailyCounts = {};
  let totalAppointments = 0;
  const totalPatients = new Set();
  let completedAppointments = 0;
  let upcomingAppointments = 0;
  let cancelledAppointments = 0;
  let followUpsDue = 0;
  let bookedSlotsCount = 0;
  let totalAvailableSlotsCount = 0;

  const daysArr = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const availabilitySlots = doctorProfile.schedule || {};

  for (let i = 0; i < 7; i++) {
    const dayDate = new Date(weekStart);
    dayDate.setDate(weekStart.getDate() + i);
    const dateStr = dayDate.toISOString().split('T')[0];
    const dayName = daysArr[i];
    
    const slotsForDay = availabilitySlots[dayName] ? availabilitySlots[dayName].length : 0;
    
    dailyCounts[dateStr] = {
      date: dateStr,
      dayName,
      appointments: 0,
      patientsSet: new Set(),
      patients: 0,
      availableSlotsRemaining: slotsForDay
    };

    totalAvailableSlotsCount += slotsForDay;
  }

  const formattedAppointments = appointments.map(app => {
    const appDate = new Date(app.dateTime);
    const dateStr = appDate.toISOString().split('T')[0];
    const duration = app.duration || 15;
    const slotsTaken = Math.ceil(duration / 15);

    if (dailyCounts[dateStr]) {
      dailyCounts[dateStr].appointments++;
      if (app.patientId) dailyCounts[dateStr].patientsSet.add(app.patientId._id.toString());
      
      if (['pending', 'confirmed', 'completed', 'in-progress'].includes(app.status)) {
        dailyCounts[dateStr].availableSlotsRemaining = Math.max(0, dailyCounts[dateStr].availableSlotsRemaining - slotsTaken);
        bookedSlotsCount += slotsTaken;
      }
    }

    totalAppointments++;
    if (app.patientId) totalPatients.add(app.patientId._id.toString());
    
    if (app.status === 'completed') completedAppointments++;
    if (['pending', 'confirmed'].includes(app.status)) upcomingAppointments++;
    if (app.status === 'cancelled') cancelledAppointments++;
    if (app.type === 'follow-up') followUpsDue++;

    const startH = appDate.getHours().toString().padStart(2, '0');
    const startM = appDate.getMinutes().toString().padStart(2, '0');
    
    const endDate = new Date(appDate.getTime() + duration * 60000);
    const endH = endDate.getHours().toString().padStart(2, '0');
    const endM = endDate.getMinutes().toString().padStart(2, '0');

    return {
      appointmentId: app._id,
      patientId: app.patientId?._id,
      patientName: app.patientId?.userId?.name || app.patientId?.fullName || "Patient",
      patientPhoto: app.patientId?.userId?.profilePicture,
      appointmentDate: dateStr,
      startTime: `${startH}:${startM}`,
      endTime: `${endH}:${endM}`,
      appointmentType: app.type || 'consultation',
      status: app.status
    };
  });

  // Convert sets to numbers for dailyCounts
  Object.keys(dailyCounts).forEach(dateStr => {
    dailyCounts[dateStr].patients = dailyCounts[dateStr].patientsSet.size;
    delete dailyCounts[dateStr].patientsSet;
  });

  const utilizationPercentage = totalAvailableSlotsCount > 0 
    ? Math.round((bookedSlotsCount / totalAvailableSlotsCount) * 100) 
    : 0;

  const responseData = {
    weekStart: weekStartStr,
    weekEnd: weekEnd.toISOString().split('T')[0],
    availabilitySlots,
    appointments: formattedAppointments,
    utilizationMetrics: {
      percentage: utilizationPercentage,
      bookedHours: bookedSlotsCount * 0.25,
      availableHours: totalAvailableSlotsCount * 0.25
    },
    dailyCounts,
    weeklyStats: {
      totalAppointments,
      totalPatients: totalPatients.size,
      completedAppointments,
      upcomingAppointments,
      cancelledAppointments,
      followUpsDue,
      weeklyRevenue: 0 // Optional: implement revenue calculation
    }
  };

  await redis.set(cacheKey, JSON.stringify(responseData), { ex: 3600 }); // 1 hour cache

  res.status(200).json(new ApiResponse(200, responseData, 'Weekly schedule fetched successfully'));
});

/**
 * @desc    Get doctor's schedule
 * @route   GET /api/doctor/schedule
 * @access  Private (Doctor only)
 */
exports.getSchedule = asyncHandler(async (req, res) => {
  const doctorProfile = await Doctor.findOne({ userId: req.user._id });

  if (!doctorProfile) {
    throw new ApiError(404, 'Doctor profile not found');
  }

  const schedule = doctorProfile.schedule || {
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
    saturday: [],
    sunday: []
  };

  res.status(200).json(
    new ApiResponse(200, { schedule }, 'Schedule fetched successfully')
  );
});

/**
 * @desc    Update doctor's schedule
 * @route   PUT /api/doctor/schedule
 * @access  Private (Doctor only)
 */
exports.updateSchedule = asyncHandler(async (req, res) => {
  const { schedule } = req.body;

  if (!schedule) {
    throw new ApiError(400, 'Schedule data is required');
  }

  const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  
  for (const day of Object.keys(schedule)) {
    if (!validDays.includes(day.toLowerCase())) {
      throw new ApiError(400, `Invalid day: ${day}`);
    }

    if (!Array.isArray(schedule[day])) {
      throw new ApiError(400, `Schedule for ${day} must be an array of time slots`);
    }
  }

  const doctorProfile = await Doctor.findOne({ userId: req.user._id });

  if (!doctorProfile) {
    throw new ApiError(404, 'Doctor profile not found');
  }

  doctorProfile.schedule = {
    monday: schedule.monday || [],
    tuesday: schedule.tuesday || [],
    wednesday: schedule.wednesday || [],
    thursday: schedule.thursday || [],
    friday: schedule.friday || [],
    saturday: schedule.saturday || [],
    sunday: schedule.sunday || []
  };

  doctorProfile.markModified('schedule');
  await doctorProfile.save();
  await invalidateAllDoctorScheduleCaches(req.user._id);

  res.status(200).json(
    new ApiResponse(200, { schedule: doctorProfile.schedule }, 'Schedule updated successfully')
  );
});

/**
 * @desc    Update specific day schedule
 * @route   PUT /api/doctor/schedule/:day
 * @access  Private (Doctor only)
 */
exports.updateDaySchedule = asyncHandler(async (req, res) => {
  const { day } = req.params;
  const { isAvailable, slots } = req.body;

  const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  
  if (!validDays.includes(day.toLowerCase())) {
    throw new ApiError(400, 'Invalid day');
  }

  const doctorProfile = await Doctor.findOne({ userId: req.user._id });

  if (!doctorProfile) {
    throw new ApiError(404, 'Doctor profile not found');
  }

  if (!doctorProfile.schedule) {
    doctorProfile.schedule = {};
  }

  doctorProfile.schedule[day] = {
    isAvailable: isAvailable !== undefined ? isAvailable : false,
    slots: slots || []
  };

  await doctorProfile.save();
  await invalidateAllDoctorScheduleCaches(req.user._id);

  res.status(200).json(
    new ApiResponse(200, { schedule: doctorProfile.schedule }, `${day} schedule updated successfully`)
  );
});

/**
 * @desc    Get available slots for a specific date
 * @route   GET /api/doctor/schedule/slots
 * @access  Public
 */
exports.getAvailableSlots = asyncHandler(async (req, res) => {
  const { doctorId, date } = req.query;

  if (!doctorId || !date) {
    throw new ApiError(400, 'Doctor ID and date are required');
  }

  const doctorProfile = await Doctor.findOne({ userId: doctorId });

  if (!doctorProfile) {
    throw new ApiError(404, 'Doctor not found');
  }

  const requestedDate = new Date(date);
  const dayName = requestedDate.toLocaleLowerCase('en-US', { weekday: 'long' }).toLowerCase();

  const daySchedule = doctorProfile.schedule?.[dayName];

  if (!daySchedule || !daySchedule.isAvailable) {
    return res.status(200).json(
      new ApiResponse(200, { availableSlots: [] }, 'No slots available for this day')
    );
  }

  // Here you could add logic to check for existing appointments and filter out booked slots
  // For now, returning all configured slots
  res.status(200).json(
    new ApiResponse(200, { availableSlots: daySchedule.slots }, 'Available slots fetched successfully')
  );
});

/**
 * @desc    Add a time slot to a specific day
 * @route   POST /api/doctor/schedule/:day/slots
 * @access  Private (Doctor only)
 */
exports.addSlot = asyncHandler(async (req, res) => {
  const { day } = req.params;
  const { startTime, endTime } = req.body;

  const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  
  if (!validDays.includes(day.toLowerCase())) {
    throw new ApiError(400, 'Invalid day');
  }

  if (!startTime || !endTime) {
    throw new ApiError(400, 'Start time and end time are required');
  }

  const doctorProfile = await Doctor.findOne({ userId: req.user._id });

  if (!doctorProfile) {
    throw new ApiError(404, 'Doctor profile not found');
  }

  if (!doctorProfile.schedule) {
    doctorProfile.schedule = {};
  }

  if (!doctorProfile.schedule[day]) {
    doctorProfile.schedule[day] = { isAvailable: true, slots: [] };
  }

  doctorProfile.schedule[day].slots.push({ startTime, endTime });
  await doctorProfile.save();
  await invalidateAllDoctorScheduleCaches(req.user._id);

  res.status(201).json(
    new ApiResponse(201, { schedule: doctorProfile.schedule }, 'Slot added successfully')
  );
});

/**
 * @desc    Remove a time slot from a specific day
 * @route   DELETE /api/doctor/schedule/:day/slots/:slotIndex
 * @access  Private (Doctor only)
 */
exports.removeSlot = asyncHandler(async (req, res) => {
  const { day, slotIndex } = req.params;

  const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  
  if (!validDays.includes(day.toLowerCase())) {
    throw new ApiError(400, 'Invalid day');
  }

  const doctorProfile = await Doctor.findOne({ userId: req.user._id });

  if (!doctorProfile) {
    throw new ApiError(404, 'Doctor profile not found');
  }

  if (!doctorProfile.schedule?.[day]?.slots) {
    throw new ApiError(404, 'No slots found for this day');
  }

  const index = parseInt(slotIndex);
  if (index < 0 || index >= doctorProfile.schedule[day].slots.length) {
    throw new ApiError(400, 'Invalid slot index');
  }

  doctorProfile.schedule[day].slots.splice(index, 1);
  await doctorProfile.save();
  await invalidateAllDoctorScheduleCaches(req.user._id);

  res.status(200).json(
    new ApiResponse(200, { schedule: doctorProfile.schedule }, 'Slot removed successfully')
  );
});
