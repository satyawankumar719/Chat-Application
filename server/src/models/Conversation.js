import mongoose from "mongoose";

const memberSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    role: {
      type: String,
      enum: ["owner", "admin", "member"],
      default: "member"
    },

    joinedAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const chatSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["direct", "group"],
      default: "direct"
    },

    members: [memberSchema],

    name: {
      type: String,
      trim: true,
      default: ""
    },

    description: {
      type: String,
      trim: true,
      default: ""
    },

    avatar: {
      url: String,
      publicId: String
    },

    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message"
    },

    unreadCount: {
      type: Map,
      of: Number,
      default: {}
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

chatSchema.index({ "members.user": 1 });

chatSchema.index({ updatedAt: -1 });

export default mongoose.model("Chat", chatSchema);