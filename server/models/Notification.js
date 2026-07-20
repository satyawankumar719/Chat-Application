import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    type: {
        type: String,
        enum: [
            "message",
            "group",
            "call",
            "friend_request"
        ],
        required: true
    },

    title: String,

    body: String,

    data: {
        chat: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Chat"
        },
        message: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Message"
        }
    },

    isRead: {
        type: Boolean,
        default: false
    },
     se
    readAt: Date

}, {
    timestamps: true
});

notificationSchema.index({
    receiver: 1,
    createdAt: -1
});

export default mongoose.model('Notification',notificationSchema)