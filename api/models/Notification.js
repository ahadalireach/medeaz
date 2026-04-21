const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
    {
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        title: {
            type: String,
            required: true,
        },
        message: {
            type: String,
            required: true,
        },
        type: {
            type: String,
            enum: ["info", "success", "warning", "error"],
            default: "info",
        },
        link: {
            type: String,
        },
        read: {
            type: Boolean,
            default: false,
        },
        portal: {
            type: String,
            enum: ["patient", "doctor", "clinic_admin", "general"],
            default: "general",
        },
    },
    { timestamps: true }
);

// Index for TTL or manual cleanup
notificationSchema.index({ createdAt: 1 });

module.exports = mongoose.model("Notification", notificationSchema);
