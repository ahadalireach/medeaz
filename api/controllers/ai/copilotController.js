const groqService = require('../../services/groqService');
const asyncHandler = require('../../utils/asyncHandler');
const ApiError = require('../../utils/ApiError');
const ApiResponse = require('../../utils/ApiResponse');
const Patient = require('../../models/Patient');
const Appointment = require('../../models/Appointment');
const Prescription = require('../../models/Prescription');

/**
 * @desc    Process doctor voice input to generate an action plan
 * @route   POST /api/ai/copilot/process-audio
 * @access  Private (Doctor)
 */
exports.processAudio = asyncHandler(async (req, res) => {
  const doctorId = req.user._id;

  if (!req.file) {
    throw new ApiError(400, 'Audio file is required');
  }

  const audioBuffer = req.file.buffer;
  const mimetype = req.file.mimetype;

  // 1. Transcribe Audio
  const transcription = await groqService.transcribeAudio(audioBuffer, mimetype);

  // 2. Fetch context if needed
  // Let's get today's appointments for the doctor as context
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const appointments = await Appointment.find({
    doctorId: doctorId,
    dateTime: { $gte: today, $lt: tomorrow }
  }).populate('patientId', 'name email');

  const doctorContext = {
    todayAppointments: appointments.map(a => ({
      id: a._id,
      patientName: a.patientId?.name,
      time: a.time,
      status: a.status
    })),
    currentDate: new Date().toISOString()
  };

  // 3. Generate Action Plan
  const actionPlan = await groqService.generateActionPlan(transcription, doctorContext);

  res.status(200).json(
    new ApiResponse(200, {
      transcription,
      actionPlan
    }, 'Action plan generated successfully')
  );
});
