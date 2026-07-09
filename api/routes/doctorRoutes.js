const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const searchRateLimit = require('../middleware/searchRateLimit');

// Import controllers
const prescriptionController = require('../controllers/doctor/prescriptionController');
const patientController = require('../controllers/doctor/patientController');
const appointmentController = require('../controllers/doctor/appointmentController');
const scheduleController = require('../controllers/doctor/scheduleController');
const revenueController = require('../controllers/doctor/revenueController');
const profileController = require('../controllers/doctor/profileController');
const connectionRequestController = require('../controllers/doctor/connectionRequestController');
const clinicController = require('../controllers/doctor/clinicController');

// All routes require authentication and doctor role
router.use(protect);
router.use(authorize('doctor'));

// ========== Prescription Routes ==========
router.get('/prescriptions', prescriptionController.getPrescriptions);
router.get('/prescriptions/:id', prescriptionController.getPrescriptionById);
router.post('/prescriptions', prescriptionController.createPrescription);
router.put('/prescriptions/:id', prescriptionController.updatePrescription);
router.delete('/prescriptions/:id', prescriptionController.deletePrescription);

// ========== Patient Routes ==========
router.get('/patients', searchRateLimit, patientController.getPatients);
router.post('/patients', patientController.createPatient);
router.get('/patients/search', searchRateLimit, patientController.searchPatients);
router.get('/patients/find', searchRateLimit, patientController.findPatientByEmail);
router.get('/patients/:id', patientController.getPatientById);
router.delete('/patients/:id', patientController.deletePatient);

// ========== Appointment Routes ==========
router.get('/appointments', appointmentController.getAppointments);
router.post('/appointments', appointmentController.createAppointment);
router.get('/appointments/today', appointmentController.getTodayQueue);
router.get('/appointments/:id', appointmentController.getAppointmentById);
router.put('/appointments/:id', appointmentController.updateAppointmentStatus);
router.put('/appointments/:id/start', appointmentController.startAppointment);
router.put('/appointments/:id/complete', appointmentController.completeAppointment);
router.delete('/appointments/:id', appointmentController.deleteAppointment);

// ========== Schedule Routes ==========
router.get('/schedule', scheduleController.getSchedule);
router.get('/schedule/week', scheduleController.getWeeklySchedule);
router.put('/schedule', scheduleController.updateSchedule);
router.put('/schedule/:day', scheduleController.updateDaySchedule);
router.get('/schedule/slots', scheduleController.getAvailableSlots);
router.post('/schedule/:day/slots', scheduleController.addSlot);
router.delete('/schedule/:day/slots/:slotIndex', scheduleController.removeSlot);

// ========== Profile Routes ==========
router.get('/profile', profileController.getProfile);
router.put('/profile', profileController.updateProfile);
router.patch('/availability', profileController.updateAvailability);
router.delete('/clinic', clinicController.leaveClinic);

// ========== Revenue Routes ==========
router.get('/revenue', revenueController.getRevenue);
router.get('/revenue/history', revenueController.getRevenueHistory);
router.delete('/revenue/history', revenueController.clearRevenueHistory);
router.delete('/revenue/history/:id', revenueController.deleteRevenueHistoryRecord);

// ========== Connection Request Routes ==========
router.get('/connection-requests', connectionRequestController.getIncomingRequests);
router.put('/connection-requests/:requestId/accept', connectionRequestController.acceptRequest);
router.put('/connection-requests/:requestId/decline', connectionRequestController.declineRequest);

// ========== Follow-Up Routes ==========
const doctorFollowUpController = require('../controllers/doctor/followUpController');
router.post('/patients/:patientId/follow-ups', doctorFollowUpController.createFollowUp);

module.exports = router;
