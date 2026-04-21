const cron = require('node-cron');
const Appointment = require('../models/Appointment');
const Prescription = require('../models/Prescription');
const Notification = require('../models/Notification');
const Analytics = require('../models/Analytics');
const Clinic = require('../models/Clinic');
const { sendEmail } = require('../services/emailService');

// 1. Follow-Up Reminder (Every 6 hours)
cron.schedule('0 */6 * * *', async () => {
    console.log('Running Follow-Up Reminder Job...');
    try {
        const now = new Date();
        const next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        const prescriptions = await Prescription.find({
            followUpDate: { $gte: now, $lte: next24h }
        }).populate('patientId doctorId');

        for (const rx of prescriptions) {
            if (!rx.patientId || !rx.doctorId) continue;

            const title = 'Follow-up Reminder';
            const followUpDateStr = new Date(rx.followUpDate).toLocaleDateString('en-US', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
            });

            const existing = await Notification.findOne({
                recipient: rx.patientId._id,
                title,
                createdAt: { $gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) }
            });

            if (!existing) {
                // In-app notification
                await Notification.create({
                    recipient: rx.patientId._id,
                    sender: rx.doctorId._id,
                    title,
                    message: `This is a reminder for your scheduled follow-up with Dr. ${rx.doctorId.name} on ${followUpDateStr}. Please book an appointment if you haven't yet.`,
                    type: 'info',
                    link: '/dashboard/patient/appointments?action=book',
                    portal: 'patient'
                });

                // Email reminder to patient
                try {
                    sendEmail(
                        rx.patientId.email,
                        `Follow-Up Reminder: Appointment with Dr. ${rx.doctorId.name}`,
                        'followUpReminder',
                        {
                            patientName: rx.patientId.name,
                            doctorName: rx.doctorId.name,
                            date: followUpDateStr
                        }
                    );
                    console.log(`[FOLLOW-UP] Email sent to ${rx.patientId.email}`);
                } catch (emailErr) {
                    console.error('[FOLLOW-UP] Failed to send email:', emailErr.message);
                }
            }
        }
    } catch (error) {
        console.error('Follow-Up Reminder Job Error:', error);
    }
});

// 2. Appointment Reminder (Every hour)
cron.schedule('0 * * * *', async () => {
    console.log('Running Appointment Reminder Job...');
    try {
        const now = new Date();
        // For 24h reminder
        const tomorrowNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const tomorrowNextHour = new Date(now.getTime() + 25 * 60 * 60 * 1000);

        // For 1h reminder
        const nextHour = new Date(now.getTime() + 60 * 60 * 1000);
        const next2Hours = new Date(now.getTime() + 2 * 60 * 60 * 1000);

        const appointments24h = await Appointment.find({
            dateTime: { $gte: tomorrowNow, $lte: tomorrowNextHour },
            status: 'confirmed'
        }).populate('patientId doctorId');

        for (const appt of appointments24h) {
            const title = 'Appointment Reminder (24h)';
            const existing = await Notification.findOne({
                recipient: appt.patientId._id,
                title,
                createdAt: { $gte: new Date(now.getTime() - 12 * 60 * 60 * 1000) }
            });

            if (!existing) {
                await Notification.create({
                    recipient: appt.patientId._id,
                    title,
                    message: `You have an appointment with Dr. ${appt.doctorId?.name} tomorrow at ${new Date(appt.dateTime).toLocaleTimeString()}.`,
                    type: 'info',
                    link: `/dashboard/patient/appointments`
                });
            }
        }

        const appointments1h = await Appointment.find({
            dateTime: { $gte: nextHour, $lte: next2Hours },
            status: 'confirmed'
        }).populate('patientId doctorId');

        for (const appt of appointments1h) {
            const title = 'Appointment Reminder (1h)';
            const existing = await Notification.findOne({
                recipient: appt.patientId._id,
                title,
                createdAt: { $gte: new Date(now.getTime() - 2 * 60 * 60 * 1000) }
            });

            if (!existing) {
                await Notification.create({
                    recipient: appt.patientId._id,
                    title,
                    message: `Your appointment with Dr. ${appt.doctorId?.name} is in 1 hour.`,
                    type: 'info',
                    link: `/dashboard/patient/appointments`
                });
            }
        }
    } catch (error) {
        console.error('Appointment Reminder Job Error:', error);
    }
});

// 3. Analytics Snapshot (Daily 2 AM)
cron.schedule('0 2 * * *', async () => {
    console.log('Running Analytics Snapshot Job...');
    try {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);

        const yesterdayEnd = new Date(yesterday);
        yesterdayEnd.setHours(23, 59, 59, 999);

        const clinics = await Clinic.find({});

        for (const clinic of clinics) {
            const appointments = await Appointment.find({
                clinicId: clinic._id,
                dateTime: { $gte: yesterday, $lte: yesterdayEnd }
            });

            const completed = appointments.filter(a => a.status === 'completed');
            const cancelled = appointments.filter(a => a.status === 'cancelled');

            let totalRevenue = 0;
            let doctorStatsMap = new Map();

            for (const appt of completed) {
                if (appt.clinicRevenueShare) {
                    totalRevenue += appt.clinicRevenueShare;
                } else if (appt.totalAmount) {
                    totalRevenue += appt.totalAmount * 0.2; // roughly
                }

                if (appt.doctorId) {
                    const docId = appt.doctorId.toString();
                    if (!doctorStatsMap.has(docId)) {
                        doctorStatsMap.set(docId, { count: 0 });
                    }
                    const dt = doctorStatsMap.get(docId);
                    dt.count += 1;
                }
            }

            const uniquePatients = new Set(appointments.map(a => a.patientId?.toString())).size;

            const doctorStatsArray = [];
            for (const [docId, stat] of doctorStatsMap.entries()) {
                doctorStatsArray.push({
                    doctorId: docId,
                    appointmentsCompleted: stat.count,
                    avgVisitTime: 15 // Placeholder logic to be updated if needed
                });
            }

            await Analytics.findOneAndUpdate(
                { clinicId: clinic._id, date: yesterday },
                {
                    totalPatients: uniquePatients,
                    totalAppointments: appointments.length,
                    completedAppointments: completed.length,
                    cancelledAppointments: cancelled.length,
                    revenue: totalRevenue,
                    doctorStats: doctorStatsArray
                },
                { upsert: true, new: true }
            );
        }
        console.log('Analytics Snapshot executed successfully.');

    } catch (error) {
        console.error('Analytics Snapshot Job Error:', error);
    }
});

// 4. Appointment Auto-Management (Every 10 minutes)
cron.schedule('*/10 * * * *', async () => {
    console.log('Running Appointment Auto-Management Job...');
    try {
        const now = new Date();
        
        // 4.1 Auto-complete in-progress appointments whose duration has passed
        const inProgress = await Appointment.find({ status: 'in-progress' });
        for (const appt of inProgress) {
            const appointmentTime = new Date(appt.dateTime);
            const durationMinutes = appt.duration || 30;
            const expectedEndTime = new Date(appointmentTime.getTime() + durationMinutes * 60000);
            
            // If the appointment started more than 1 hour ago or its duration is over
            // We give it a small buffer of 5 minutes
            if (now > new Date(expectedEndTime.getTime() + 5 * 60000)) {
                appt.status = 'completed';
                appt.completedAt = now;
                await appt.save();
                console.log(`Auto-completed appointment ${appt._id}`);
            }
        }

        // 4.2 Auto-cancel previous day's incomplete appointments
        // Only run this if we are in the first hour of the day to avoid heavy queries constantly
        // But specifically after 10-15 minutes of the next day as requested
        if (now.getHours() === 0 && now.getMinutes() >= 10) {
            const startOfToday = new Date(now);
            startOfToday.setHours(0, 0, 0, 0);

            const incompleteOld = await Appointment.find({
                dateTime: { $lt: startOfToday },
                status: { $in: ['pending', 'confirmed', 'in-progress'] }
            });

            for (const appt of incompleteOld) {
                appt.status = 'cancelled';
                appt.cancellationReason = 'Automatically cancelled by system (End of Day)';
                appt.cancelledAt = now;
                await appt.save();
                console.log(`Auto-cancelled appointment ${appt._id} from previous day`);
            }
        }
    } catch (error) {
        console.error('Appointment Auto-Management Job Error:', error);
    }
});

// 5. Late Appointment Cancellation (Every 5 minutes)
cron.schedule('*/5 * * * *', async () => {
    console.log('Running Late Appointment Cancellation Job...');
    try {
        const now = new Date();
        const bufferTime = new Date(now.getTime() - 15 * 60 * 1000); 

        const lateAppointments = await Appointment.find({
            dateTime: { $lt: bufferTime },
            status: { $in: ['pending', 'confirmed'] }
        });

        for (const appt of lateAppointments) {
            appt.status = 'cancelled';
            appt.cancellationReason = 'Automatically cancelled: 15-minute start window expired';
            appt.cancelledAt = now;
            await appt.save();
            console.log(`Auto-cancelled late appointment ${appt._id}`);
        }
    } catch (error) {
        console.error('Late Appointment Cancellation Job Error:', error);
    }
});
