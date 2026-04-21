const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  dosage: {
    type: String,
    required: true
  },
  frequency: {
    type: String,
    required: true
  },
  duration: {
    type: String,
    required: true
  },
  instructions: {
    type: String,
    default: ''
  }
}, { _id: false });

const prescriptionSchema = new mongoose.Schema({
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    default: null
  },
  diagnosis: {
    type: String,
    required: true,
    trim: true
  },
  medicines: {
    type: [medicineSchema],
    default: []
  },
  notes: {
    type: String,
    default: '',
    trim: true
  },
  rawTranscript: {
    type: String,
    default: ''
  },
  audioUrl: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['draft', 'finalized', 'modified'],
    default: 'finalized'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
prescriptionSchema.index({ doctorId: 1, createdAt: -1 });
prescriptionSchema.index({ patientId: 1, createdAt: -1 });
prescriptionSchema.index({ appointmentId: 1 });
prescriptionSchema.index({ status: 1 });

// Virtual for prescription summary
prescriptionSchema.virtual('medicineCount').get(function() {
  return this.medicines.length;
});

// Ensure virtuals are included in JSON
prescriptionSchema.set('toJSON', { virtuals: true });
prescriptionSchema.set('toObject', { virtuals: true });

const Prescription = mongoose.model('Prescription', prescriptionSchema);

module.exports = Prescription;
