const mongoose = require('mongoose');

const clinicDoctorRequestSchema = new mongoose.Schema({
  clinicId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Clinic',
    required: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined', 'cancelled'],
    default: 'pending'
  },
  message: {
    type: String,
    maxLength: 200
  },
  sentAt: {
    type: Date,
    default: Date.now
  },
  respondedAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes
clinicDoctorRequestSchema.index({ clinicId: 1, doctorId: 1 }, { unique: true });
clinicDoctorRequestSchema.index({ doctorId: 1, status: 1 });
clinicDoctorRequestSchema.index({ clinicId: 1, status: 1 });

module.exports = mongoose.model('ClinicDoctorRequest', clinicDoctorRequestSchema);
