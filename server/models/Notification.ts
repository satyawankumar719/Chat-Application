import mongoose, { Types } from "mongoose";

export interface INotification {
    sender: Types.ObjectId;
    receiver: Types.ObjectId;

    type: | "message" | "group" | "call" | "friend_request" | "invitation" | "invitation_accepted" | "invitation_rejected";

    title?: string;
    body?: string;

    data?: {
        chat?: Types.ObjectId;
        message?: Types.ObjectId;
        invitation?: Types.ObjectId;
    };

    isRead: boolean;
    readAt?: Date;

    createdAt: Date;
    updatedAt: Date;
}

const notificationSchema = new mongoose.Schema<INotification>(
    {
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        receiver: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        type: {
            type: String,
            enum: [
                "message",
                "group",
                "call",
                "friend_request",
                "invitation",
                "invitation_accepted",
                "invitation_rejected",
            ],
            required: true,
        },

        title: {
            type: String,
        },

        body: {
            type: String,
        },

        data: {
            chat: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Chat",
            },
            message: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Message",
            },
            invitation: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Invitation",
            },
        },

        isRead: {
            type: Boolean,
            default: false,
        },

        readAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

notificationSchema.index({
    receiver: 1,
    createdAt: -1,
});

export default mongoose.model<INotification>(
    "Notification",
    notificationSchema
);