const mongoose = require("mongoose");
const Doctor = require("../../models/Doctor");
const Clinic = require("../../models/Clinic");
const Staff = require("../../models/Staff");
const ClinicDoctorRequest = require("../../models/ClinicDoctorRequest");
const Appointment = require("../../models/Appointment");
const OPDToken = require("../../models/OPDToken");
const asyncHandler = require("../../utils/asyncHandler");
const ApiError = require("../../utils/ApiError");

exports.leaveClinic = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const doctor = await Doctor.findOne({ userId: req.user._id }).session(session);
    if (!doctor) {
      throw new ApiError(404, "Doctor profile not found.");
    }
    
    if (!doctor.clinicId) {
      return res.status(400).json({ success: false, message: "You're not associated with any clinic." });
    }
    
    const clinicId = doctor.clinicId;
    const clinic = await Clinic.findById(clinicId).session(session);

    // 1. Detach doctor from clinic and reset schedule
    await Doctor.findByIdAndUpdate(
      doctor._id,
      { 
        $unset: { clinicId: '' },
        $set: {
          schedule: {
            monday: [],
            tuesday: [],
            wednesday: [],
            thursday: [],
            friday: [],
            saturday: [],
            sunday: [],
          },
          statusUpdatedAt: new Date()
        }
      },
      { session }
    );

    // 2. Remove from clinic's doctors array
    await Clinic.findByIdAndUpdate(
      clinicId,
      { $pull: { doctors: doctor._id } },
      { session }
    );

    // 3. Remove Staff entry (auto-added one)
    await Staff.findOneAndDelete(
      { clinicId, linkedDoctorId: doctor._id },
      { session }
    );

    // 5. Cancel all pending ClinicDoctorRequests from this clinic
    await ClinicDoctorRequest.updateMany(
      { clinicId, doctorId: doctor._id, status: 'pending' },
      { $set: { status: 'cancelled' } },
      { session }
    );

    // 6. Flag active appointments (don't delete — historical record)
    await Appointment.updateMany(
      {
        doctorId: doctor._id,
        clinicId,
        dateTime: { $gte: new Date() },
        status: { $in: ['pending', 'confirmed'] }
      },
      { $set: { status: 'cancelled', cancellationReason: 'doctor_left_clinic' } },
      { session }
    );

    // 7. Remove from OPD queue (waiting tokens)
    await OPDToken.updateMany(
      { doctorId: doctor._id, clinicId, status: 'waiting' },
      { $set: { status: 'expired' } },
      { session }
    );

    await session.commitTransaction();

    // 8. Post-commit side effects (notifications, sockets)
    const { sendNotification } = require("../../services/notificationService");

    if (clinic && clinic.adminId) {
      try {
        await sendNotification(clinic.adminId, {
          type: "doctor_left_clinic",
          titleKey: "doctorLeft.title",
          bodyKey: "doctorLeft.body",
          bodyParams: { doctorName: req.user.name },
          actionUrl: "/dashboard/clinic_admin/doctors",
          portal: "clinic_admin"
        });

        if (global.io) {
          global.io?.to(clinic.adminId.toString())?.emit('doctor_left_clinic', {
            doctorId: doctor._id, name: req.user.name
          });
        }
      } catch (e) {
        console.error("Failed to notify clinic admin:", e.message);
      }
    }

    // Notify affected patients (bulk)
    const affectedAppointments = await Appointment.find({
      doctorId: doctor._id, 
      cancellationReason: 'doctor_left_clinic'
    }).populate('patientId');

    for (const appt of affectedAppointments) {
      if (appt.patientId && appt.patientId.userId) {
        try {
          await sendNotification(appt.patientId.userId, {
            type: 'appointment_cancelled_doctor_left',
            titleKey: "appointmentCancelled.title",
            bodyKey: "appointmentCancelled.body",
            bodyParams: { 
              doctorName: req.user.name, 
              date: new Date(appt.dateTime).toLocaleDateString() 
            },
            actionUrl: "/dashboard/patient/appointments",
            portal: "patient"
          });
        } catch (e) {
          console.error("Failed to notify patient:", e.message);
        }
      }
    }

    // Invalidate cache
    const { invalidateDoctorsCache, invalidateAllDoctorScheduleCaches } = require("../../utils/cacheHelpers");
    await invalidateDoctorsCache(clinicId);
    await invalidateAllDoctorScheduleCaches(req.user._id);

    try {
      const { redisClient } = require('../../services/redisService');
      if (redisClient) {
        await redisClient.del(`clinic_context_${clinicId}`);
        await redisClient.del(`doctor_context_${req.user._id}`);
      }
    } catch(e) {
      console.error("Failed to invalidate Redis AI contexts:", e.message);
    }

    res.status(200).json({ success: true, message: 'Successfully left clinic. Schedule has been reset.' });
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
});
