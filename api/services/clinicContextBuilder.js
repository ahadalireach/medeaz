const Clinic = require('../models/Clinic');
const Staff = require('../models/Staff');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const User = require('../models/User');
const RevenueEntry = require('../models/RevenueEntry');
const OPDToken = require('../models/OPDToken');
 
/**
 * Assembles a structured summary context of the clinic's database state.
 * Queries are optimized to run in parallel using Promise.all.
 *
 * @param {string|ObjectId} clinicId
 * @returns {Promise<Object>}
 */
async function buildClinicContext(clinicId) {
  // Fetch clinic doc
  const clinicDoc = await Clinic.findById(clinicId);
  if (!clinicDoc) {
    throw new Error('Clinic not found');
  }
 
  // Get date ranges
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(startOfToday);
  tomorrow.setDate(tomorrow.getDate() + 1);
 
  // Start of this week (assume Sunday is start of week)
  const startOfThisWeek = new Date(now);
  const day = startOfThisWeek.getDay();
  const diff = startOfThisWeek.getDate() - day;
  startOfThisWeek.setDate(diff);
  startOfThisWeek.setHours(0, 0, 0, 0);
 
  // Start of this month
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
 
  // Last month range
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
 
  // Parallel DB queries using Promise.all
  const [
    doctors,
    staffList,
    appointments,
    createdPatients,
    appointmentsToday,
    appointmentsThisMonth,
    pendingAppointments,
    cancelledThisMonth,
    revenueTodayAgg,
    revenueThisWeekAgg,
    revenueThisMonthAgg,
    revenueLastMonthAgg,
    topDocsRevenue,
    topDocsAppts,
    recentApptsData,
    opdTokensToday
  ] = await Promise.all([
    // Doctors
    Doctor.find({
      $or: [
        { clinicId },
        { _id: { $in: clinicDoc.doctors || [] } }
      ]
    }).populate('userId', 'name email'),
    // Staff list
    Staff.find({ clinicId }),
    // Appointments to find unique patientIds
    Appointment.find({ clinicId, deletedByClinic: { $ne: true } }).distinct('patientId'),
    // Patients created by clinic admin
    Patient.find({ createdBy: clinicDoc.adminId }).distinct('userId'),
    // Appointments today (populated for workload mapping)
    Appointment.find({
      clinicId,
      dateTime: { $gte: startOfToday, $lt: tomorrow },
      deletedByClinic: { $ne: true }
    }).populate('patientId', 'name').lean(),
    // Appointments this month
    Appointment.countDocuments({
      clinicId,
      dateTime: { $gte: startOfThisMonth },
      deletedByClinic: { $ne: true }
    }),
    // Pending appointments
    Appointment.countDocuments({
      clinicId,
      status: 'pending',
      deletedByClinic: { $ne: true }
    }),
    // Cancelled this month
    Appointment.countDocuments({
      clinicId,
      status: 'cancelled',
      dateTime: { $gte: startOfThisMonth },
      deletedByClinic: { $ne: true }
    }),
    // Revenue today (fully aggregated breakdown)
    RevenueEntry.aggregate([
      { $match: { clinicId, occurredAt: { $gte: startOfToday } } },
      { $group: { 
          _id: null, 
          clinicShare: { $sum: '$clinicShare' },
          doctorShare: { $sum: '$doctorShare' },
          consultationFee: { $sum: '$consultationFee' },
          medicineCost: { $sum: '$medicineCost' },
          totalCost: { $sum: '$totalCost' }
      } }
    ]),
    // Revenue this week (fully aggregated breakdown)
    RevenueEntry.aggregate([
      { $match: { clinicId, occurredAt: { $gte: startOfThisWeek } } },
      { $group: { 
          _id: null, 
          clinicShare: { $sum: '$clinicShare' },
          doctorShare: { $sum: '$doctorShare' },
          consultationFee: { $sum: '$consultationFee' },
          medicineCost: { $sum: '$medicineCost' },
          totalCost: { $sum: '$totalCost' }
      } }
    ]),
    // Revenue this month (fully aggregated breakdown)
    RevenueEntry.aggregate([
      { $match: { clinicId, occurredAt: { $gte: startOfThisMonth } } },
      { $group: { 
          _id: null, 
          clinicShare: { $sum: '$clinicShare' },
          doctorShare: { $sum: '$doctorShare' },
          consultationFee: { $sum: '$consultationFee' },
          medicineCost: { $sum: '$medicineCost' },
          totalCost: { $sum: '$totalCost' }
      } }
    ]),
    // Revenue last month (fully aggregated breakdown)
    RevenueEntry.aggregate([
      { $match: { clinicId, occurredAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } } },
      { $group: { 
          _id: null, 
          clinicShare: { $sum: '$clinicShare' },
          doctorShare: { $sum: '$doctorShare' },
          consultationFee: { $sum: '$consultationFee' },
          medicineCost: { $sum: '$medicineCost' },
          totalCost: { $sum: '$totalCost' }
      } }
    ]),
    // Top doctors by revenue this month (doctor share)
    RevenueEntry.aggregate([
      { $match: { clinicId, occurredAt: { $gte: startOfThisMonth } } },
      { $group: { _id: '$doctorUserId', revenueThisMonth: { $sum: '$doctorShare' } } }
    ]),
    // Top doctors by appointments count this month
    Appointment.aggregate([
      {
        $match: {
          clinicId,
          dateTime: { $gte: startOfThisMonth },
          status: 'completed',
          deletedByClinic: { $ne: true }
        }
      },
      { $group: { _id: '$doctorId', appointmentsThisMonth: { $sum: 1 } } }
    ]),
    // Recent 5 appointments
    Appointment.find({ clinicId, deletedByClinic: { $ne: true } })
      .sort({ dateTime: -1 })
      .limit(5)
      .populate('doctorId', 'name')
      .populate('patientId', 'name')
      .lean(),
    // OPD Tokens today
    OPDToken.find({
      clinicId,
      createdAt: { $gte: startOfToday, $lt: tomorrow }
    }).lean()
  ]);
 
  // 1. Deduplicate staff and doctors
  const mergedStaff = [];
  const processedDoctorIds = new Set();
 
  for (const s of staffList) {
    if (s.linkedDoctorId) {
      processedDoctorIds.add(s.linkedDoctorId.toString());
    }
    mergedStaff.push({
      id: s._id.toString(),
      name: s.name,
      email: s.email || '',
      role: s.role || 'Staff',
      joinedDate: s.createdAt
    });
  }
 
  for (const d of doctors) {
    if (!processedDoctorIds.has(d._id.toString())) {
      mergedStaff.push({
        id: d._id.toString(),
        name: d.fullName,
        email: d.userId?.email || '',
        role: 'Doctor',
        joinedDate: d.createdAt
      });
    }
  }
 
  // Count staff members by role
  const staffByRole = {};
  for (const s of mergedStaff) {
    const roleKey = (s.role || 'staff').toLowerCase();
    staffByRole[roleKey] = (staffByRole[roleKey] || 0) + 1;
  }
 
  // 2. Patient count
  const allPatientIds = [...new Set([
    ...appointments.map(id => id.toString()),
    ...createdPatients.map(id => id.toString())
  ])];
  const totalPatients = allPatientIds.length;
 
  // 3. Top doctors mapping
  const docMap = {};
  for (const doc of doctors) {
    const userIdStr = doc.userId?._id?.toString() || doc.userId?.toString();
    if (userIdStr) {
      docMap[userIdStr] = {
        name: doc.fullName || doc.userId?.name || 'Doctor',
        appointmentsThisMonth: 0,
        revenueThisMonth: 0,
        status: 'active'
      };
    }
  }

  // Find missing doctors from topDocsAppts and topDocsRevenue
  const missingDoctorUserIds = new Set();
  [...topDocsAppts, ...topDocsRevenue].forEach(doc => {
    const idStr = doc._id?.toString();
    if (idStr && !docMap[idStr]) {
      missingDoctorUserIds.add(idStr);
    }
  });

  if (missingDoctorUserIds.size > 0) {
    const missingDoctors = await User.find({ _id: { $in: Array.from(missingDoctorUserIds) } }).lean();
    for (const md of missingDoctors) {
      docMap[md._id.toString()] = {
        name: md.name || 'Former Doctor',
        appointmentsThisMonth: 0,
        revenueThisMonth: 0,
        status: 'former'
      };
    }
  }

  for (const appt of topDocsAppts) {
    const idStr = appt._id?.toString();
    if (docMap[idStr]) {
      docMap[idStr].appointmentsThisMonth = appt.appointmentsThisMonth;
    }
  }

  for (const rev of topDocsRevenue) {
    const idStr = rev._id?.toString();
    if (docMap[idStr]) {
      docMap[idStr].revenueThisMonth = rev.revenueThisMonth;
    }
  }

  const topDoctors = Object.values(docMap)
    .filter(d => d.revenueThisMonth > 0 || d.appointmentsThisMonth > 0)
    .sort((a, b) => b.revenueThisMonth - a.revenueThisMonth);
 
  // 4. Calculate today's workload and format detailed doctor schedules/status
  const doctorWorkloadToday = {};
  for (const d of doctors) {
    doctorWorkloadToday[d._id.toString()] = 0;
  }
  for (const appt of appointmentsToday) {
    const docUserId = appt.doctorId?._id || appt.doctorId;
    const docProfile = doctors.find(d => d.userId?._id?.toString() === docUserId?.toString());
    if (docProfile) {
      doctorWorkloadToday[docProfile._id.toString()]++;
    }
  }
 
  const detailedDoctors = doctors.map(d => ({
    id: d._id.toString(),
    name: d.fullName,
    specialization: d.specialization,
    consultationFee: d.consultationFee,
    availabilityStatus: d.availabilityStatus || 'available',
    schedule: d.schedule || {},
    workloadToday: doctorWorkloadToday[d._id.toString()] || 0
  }));
 
  // 5. Calculate OPD queue metrics
  const opdTokensCount = opdTokensToday.length;
  const opdTokensByStatus = {
    waiting: 0,
    called: 0,
    completed: 0,
    skipped: 0,
    expired: 0
  };
  
  // Group OPD tokens by doctor and status
  const opdQueuesByDoctor = {};
  for (const d of doctors) {
    opdQueuesByDoctor[d.userId?._id?.toString() || d.userId?.toString()] = {
      doctorName: d.fullName,
      waiting: [],
      called: null,
      completedCount: 0,
      skippedCount: 0
    };
  }
 
  for (const token of opdTokensToday) {
    const status = token.status || 'waiting';
    if (opdTokensByStatus[status] !== undefined) {
      opdTokensByStatus[status]++;
    }
 
    const docUserIdStr = token.doctorId?.toString();
    if (docUserIdStr && opdQueuesByDoctor[docUserIdStr]) {
      const tokenSummary = {
        tokenNumber: token.tokenNumber,
        patientName: token.patientName,
        status: token.status,
        issuedAt: token.issuedAt,
        calledAt: token.calledAt
      };
 
      if (token.status === 'waiting') {
        opdQueuesByDoctor[docUserIdStr].waiting.push(tokenSummary);
      } else if (token.status === 'called') {
        opdQueuesByDoctor[docUserIdStr].called = tokenSummary;
      } else if (token.status === 'completed') {
        opdQueuesByDoctor[docUserIdStr].completedCount++;
      } else if (token.status === 'skipped' || token.status === 'expired') {
        opdQueuesByDoctor[docUserIdStr].skippedCount++;
      }
    }
  }
 
  // Sort waiting list by token number for each doctor
  for (const docIdStr in opdQueuesByDoctor) {
    opdQueuesByDoctor[docIdStr].waiting.sort((a, b) => a.tokenNumber - b.tokenNumber);
  }
 
  const opdQueueStatus = {
    totalTokensIssuedToday: opdTokensCount,
    countsByStatus: opdTokensByStatus,
    queuesByDoctor: Object.values(opdQueuesByDoctor)
  };
 
  // 6. Recent appointments formatting
  const recentAppointments = await Promise.all(
    recentApptsData.map(async (a) => {
      const docProfile = doctors.find(d => d.userId?._id?.toString() === (a.doctorId?._id || a.doctorId)?.toString());
      const doctorName = docProfile?.fullName || a.doctorId?.name || 'Doctor';
      
      const patProfile = await Patient.findOne({ userId: a.patientId?._id || a.patientId });
      const patientName = patProfile?.name || a.patientId?.name || 'Patient';
 
      return {
        dateTime: a.dateTime,
        status: a.status,
        doctorName,
        patientName,
        reason: a.reason
      };
    })
  );
 
  // 7. Recent patients formatting
  const recentPatientsData = await User.find({
    _id: { $in: allPatientIds },
    roles: 'patient'
  })
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();
 
  const recentPatients = await Promise.all(
    recentPatientsData.map(async (u) => {
      const profile = await Patient.findOne({ userId: u._id });
      return {
        name: u.name,
        email: u.email,
        phone: u.phone || profile?.contact || '',
        registeredAt: u.createdAt
      };
    })
  );
 
  const context = {
    clinic: {
      name: clinicDoc.name,
      address: clinicDoc.address,
      phone: clinicDoc.phone,
      operatingHours: clinicDoc.workingHours
    },
    counts: {
      totalDoctors: doctors.length,
      totalStaff: mergedStaff.length,
      totalPatients,
      appointmentsToday: appointmentsToday.length,
      appointmentsThisMonth,
      pendingAppointments,
      cancelledThisMonth
    },
    revenue: {
      today: {
        clinicShare: revenueTodayAgg[0]?.clinicShare || 0,
        doctorShare: revenueTodayAgg[0]?.doctorShare || 0,
        consultationFee: revenueTodayAgg[0]?.consultationFee || 0,
        medicineCost: revenueTodayAgg[0]?.medicineCost || 0,
        totalCost: revenueTodayAgg[0]?.totalCost || 0
      },
      thisWeek: {
        clinicShare: revenueThisWeekAgg[0]?.clinicShare || 0,
        doctorShare: revenueThisWeekAgg[0]?.doctorShare || 0,
        consultationFee: revenueThisWeekAgg[0]?.consultationFee || 0,
        medicineCost: revenueThisWeekAgg[0]?.medicineCost || 0,
        totalCost: revenueThisWeekAgg[0]?.totalCost || 0
      },
      thisMonth: {
        clinicShare: revenueThisMonthAgg[0]?.clinicShare || 0,
        doctorShare: revenueThisMonthAgg[0]?.doctorShare || 0,
        consultationFee: revenueThisMonthAgg[0]?.consultationFee || 0,
        medicineCost: revenueThisMonthAgg[0]?.medicineCost || 0,
        totalCost: revenueThisMonthAgg[0]?.totalCost || 0
      },
      lastMonth: {
        clinicShare: revenueLastMonthAgg[0]?.clinicShare || 0,
        doctorShare: revenueLastMonthAgg[0]?.doctorShare || 0,
        consultationFee: revenueLastMonthAgg[0]?.consultationFee || 0,
        medicineCost: revenueLastMonthAgg[0]?.medicineCost || 0,
        totalCost: revenueLastMonthAgg[0]?.totalCost || 0
      }
    },
    doctors: detailedDoctors,
    appointmentsTodayDetails: appointmentsToday.map(a => {
      const docProfile = doctors.find(d => d.userId?._id?.toString() === (a.doctorId?._id || a.doctorId)?.toString());
      return {
        time: a.dateTime instanceof Date ? a.dateTime.toISOString().split('T')[1].substring(0, 5) : new Date(a.dateTime).toISOString().split('T')[1].substring(0, 5),
        doctorName: docProfile?.fullName || 'Doctor',
        patientName: a.patientId?.name || 'Patient',
        status: a.status
      };
    }),
    opdQueueStatus,
    topDoctors: topDoctors.slice(0, 5),
    staffByRole,
    recentAppointments: recentAppointments.slice(0, 5),
    recentPatients
  };
 
  // Truncation check for very large clinic data to stay under token limits
  const systemPromptEstimate = JSON.stringify(context).length / 4;
  if (systemPromptEstimate > 8000) {
    console.warn(`Clinic Context builder: context size estimate (${systemPromptEstimate} tokens) exceeds 8000 tokens. Truncating context...`);
    context.recentAppointments = recentAppointments.slice(0, 3);
    context.topDoctors = topDoctors.slice(0, 3);
    delete context.recentPatients;
  }
 
  return context;
}
 
module.exports = {
  buildClinicContext
};
