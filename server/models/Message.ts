import mongoose, { Schema, Types } from "mongoose";

export type MessageType =
  | "text"
  | "image"
  | "file"
  | "audio"
  | "video"
  | "system";

export type MessageStatus =
  | "sent"
  | "delivered"
  | "read";

export type AttachmentType =
  | "image"
  | "file"
  | "audio"
  | "video";

export interface IMessageAttachment {
  type: AttachmentType;
  fileUrl: string;
  fileName?: string | null;
  fileSize?: number | null;
}

export interface IMessageReadBy {
  user: Types.ObjectId;
  readAt: Date;
}

export interface IMessage{
  chat: Types.ObjectId;
  sender: Types.ObjectId;

  type: MessageType;
  content: string;

  fileUrl?: string | null;
  fileName?: string | null;
  fileSize?: number | null;

  attachments: IMessageAttachment[];

  replyTo?: Types.ObjectId | null;

  status: MessageStatus;

  readBy: IMessageReadBy[];

  isDeleted: boolean;
  deletedAt?: Date;

  edited: boolean;
  editedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    chat: {
      type: Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
    },

    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    type: {
      type: String,
      enum: [
        "text",
        "image",
        "file",
        "audio",
        "video",
        "system",
      ],
      default: "text",
    },

    content: {
      type: String,
      required: true,
      trim: true,
    },

    fileUrl: {
      type: String,
      default: null,
    },

    fileName: {
      type: String,
      default: null,
    },

    fileSize: {
      type: Number,
      default: null,
    },

    attachments: [
      {
        type: {
          type: String,
          enum: ["image", "file", "audio", "video"],
          required: true,
        },

        fileUrl: {
          type: String,
          required: true,
        },

        fileName: {
          type: String,
          default: null,
        },

        fileSize: {
          type: Number,
          default: null,
        },
      },
    ],

    replyTo: {
      type: Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },

    status: {
      type: String,
      enum: ["sent", "delivered", "read"],
      default: "sent",
    },

    readBy: [
      {
        user: {
          type: Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },

        readAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    isDeleted: {
      type: Boolean,
      default: false,
    },

    deletedAt: {
      type: Date,
    },

    edited: {
      type: Boolean,
      default: false,
    },

    editedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

messageSchema.index({ chat: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });

const Message = mongoose.model<IMessage>("Message", messageSchema);

export default Message;