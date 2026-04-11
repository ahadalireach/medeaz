const mongoose = require('mongoose');
const messageSchema = new mongoose.Schema({
  conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, required: true },
  senderRole: { type: String, enum: ['doctor', 'patient'], required: true },
  content: { type: String, default: '' },
  type: { type: String, enum: ['text', 'file'], default: 'text' },
  fileUrl: String,
  fileName: String,
  isRead: { type: Boolean, default: false },
  isDelivered: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });
module.exports = mongoose.model('Message', messageSchema);
