const Message = require('../models/Message');
const Conversation = require('../models/Conversation');

const chatSocket = (io) => {
  io.on('connection', (socket) => {
    socket.on('join_conversation', ({ conversationId }) => {
      socket.join(conversationId);
    });

    socket.on('leave_conversation', ({ conversationId }) => {
      socket.leave(conversationId);
    });

    socket.on('send_message', async ({ conversationId, senderId, senderRole, content, type, fileUrl, fileName }) => {
      const conv = await Conversation.findById(conversationId);
      if (!conv) return;

      const recipientId = senderRole === 'doctor' ? conv.patientId.toString() : conv.doctorId.toString();
      const onlineUsers = io.onlineUsers || new Map();
      const isDelivered = onlineUsers.has(recipientId);

      const message = await Message.create({
        conversationId, senderId, senderRole,
        content, type: type || 'text', fileUrl, fileName,
        isDelivered
      });

      const conversationUpdate = {
        lastMessage: type === 'file' ? `📎 ${fileName || 'File'}` : content,
        lastMessageAt: new Date(),
        lastMessageSender: senderRole,
        ...(senderRole === 'doctor'
          ? { $inc: { unreadCountPatient: 1 } }
          : { $inc: { unreadCountDoctor: 1 } }),
      };

      const updatedConversation = await Conversation.findByIdAndUpdate(
        conversationId, conversationUpdate, { new: true }
      ).populate('doctorId patientId');

      // Emit to the conversation room (for those currently in the chat window)
      io.to(conversationId).emit('new_message', message);
      
      // Emit to BOTH parties' individual rooms (to update their conversation lists)
      io.to(senderId.toString()).emit('conversation_updated', updatedConversation);
      io.to(recipientId).emit('conversation_updated', updatedConversation);

      // Only emit to recipient personal room when they are NOT already in the conversation room.
      // This avoids duplicate deliveries when chat is open while preserving off-chat notifications.
      const recipientSocketId = onlineUsers.get(recipientId);
      const roomSockets = io.sockets.adapter.rooms.get(conversationId);
      const recipientInConversationRoom = !!(
        recipientSocketId && roomSockets && roomSockets.has(recipientSocketId)
      );

      if (!recipientInConversationRoom) {
        io.to(recipientId).emit('new_message', message);
      }

      // Sender tick bootstrap: single gray if offline recipient, double gray if online recipient.
      io.to(senderId.toString()).emit('message_status_updated', {
        messageId: message._id,
        conversationId,
        isDelivered,
        isRead: false,
      });
    });

    socket.on('typing', ({ conversationId, senderId, isTyping }) => {
      socket.to(conversationId).emit('typing_status', { senderId, isTyping });
    });

    socket.on('message_read', async ({ conversationId, role }) => {
      const update = role === 'doctor' ? { unreadCountDoctor: 0 } : { unreadCountPatient: 0 };
      await Conversation.findByIdAndUpdate(conversationId, update);
      socket.to(conversationId).emit('messages_read', { conversationId });
    });

    socket.on('message_delivered', async ({ conversationId, messageId }) => {
      if (!conversationId || !messageId) return;

      const updated = await Message.findByIdAndUpdate(
        messageId,
        { isDelivered: true },
        { new: true }
      );

      if (!updated) return;

      io.to(conversationId).emit('message_status_updated', {
        messageId,
        conversationId,
        isDelivered: true,
        isRead: !!updated.isRead,
      });
    });
  });
};

module.exports = chatSocket;
