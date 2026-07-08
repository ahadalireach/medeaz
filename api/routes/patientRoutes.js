const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const searchRateLimit = require('../middleware/searchRateLimit');

// Import controllers
const dashboardController = require('../controllers/patient/dashboardController');
const recordsController = require('../controllers/patient/recordsController');
const appointmentsController = require('../controllers/patient/appointmentsController');
const familyController = require('../controllers/patient/familyController');
const profileController = require('../controllers/patient/profileController');
const reviewController = require('../controllers/patient/reviewController');
const connectionController = require('../controllers/patient/connectionController');

// All routes require authentication and patient role
router.use(protect);

// Allow any authenticated user (including doctors) to search clinics
router.get('/clinics', searchRateLimit, appointmentsController.getClinics);

// ========== Patient Health Engagement Score Route ==========
// Access authorized for patient (self), doctor, or clinic admin inside the controller
const healthScoreController = require('../controllers/patient/healthScoreController');
router.get('/:id/health-score', healthScoreController.getHealthScore);

router.use(authorize('patient'));

// ========== Connection Routes ==========
router.get('/connections/requests', connectionController.getConnectionRequests);
router.put('/connections/requests/:id', connectionController.handleConnectionRequest);

// ========== Review Routes ==========
router.post('/reviews', reviewController.submitReview);
router.put('/reviews/:id', reviewController.updateReview);

// ========== Clinic Review Routes ==========
const clinicReviewsController = require('../controllers/patient/clinicReviewsController');
router.post('/clinic-reviews', clinicReviewsController.submitReview);
router.get('/clinic-reviews/my', clinicReviewsController.getMyReview);
router.put('/clinic-reviews/:reviewId', clinicReviewsController.editReview);
router.delete('/clinic-reviews/:reviewId', clinicReviewsController.deleteReview);
router.post('/clinic-reviews/:reviewId/helpful', clinicReviewsController.voteReview);
router.post('/clinic-reviews/:reviewId/flag', clinicReviewsController.flagReview);

// ========== Dashboard Routes ==========
router.get('/dashboard', dashboardController.getDashboard);
router.get('/spent-history', dashboardController.getSpentHistory);

// ========== Medical Records Routes ==========
router.get('/records', recordsController.getRecords);
router.post('/records/upload', recordsController.uploadRecord);
router.get('/records/:id', recordsController.getRecordDetail);
router.delete('/records/:id', recordsController.deleteRecord);

// ========== Appointments Routes ==========
router.get('/appointments', appointmentsController.getAppointments);
router.post('/appointments', appointmentsController.bookAppointment);
router.post('/appointments/reserve-slot', appointmentsController.reserveSlot);
router.get('/appointments/available-slots', appointmentsController.getAvailableSlots);
router.put('/appointments/:id/cancel', appointmentsController.cancelAppointment);
router.delete('/appointments/:id', appointmentsController.deleteAppointment);
router.put('/appointments/:id/rate', appointmentsController.rateAppointment);
router.get('/doctors', searchRateLimit, appointmentsController.getDoctors);

// ========== Family Routes ==========
router.get('/family', familyController.getFamilyMembers);
router.post('/family', familyController.addFamilyMember);
router.put('/family/:memberId', familyController.editFamilyMember);
router.delete('/family/:memberId', familyController.deleteFamilyMember);
router.get('/family/:memberId/records', familyController.getFamilyRecords);
router.post('/family/:memberId/records', familyController.addFamilyRecord);
router.delete('/family/:memberId/records/:recordId', familyController.deleteFamilyRecord);

// ========== Profile Routes ==========
router.get('/profile', profileController.getProfile);
router.put('/profile', profileController.updateProfile);
router.put('/profile/password', profileController.updatePassword);

// ========== Follow-Up Routes ==========
const followUpController = require('../controllers/patient/followUpController');
router.get('/follow-ups', followUpController.getFollowUps);
router.put('/follow-ups/:id/complete', followUpController.completeFollowUp);

module.exports = router;
