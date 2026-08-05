import mongoose from "mongoose";

const invitationSchema = new mongoose.Schema(
  {
    invitedBy: {
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
      enum: ["direct", "group"],
      default: "direct"
    },

    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      default: null
    },

    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "expired"],
      default: "pending"
    },

    message: {
      type: String,
      trim: true,
      default: ""
    },

    rejectedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

invitationSchema.index({ invitedBy: 1, receiver: 1 });
invitationSchema.index({ receiver: 1, status: 1 });

export default mongoose.model("Invitation", invitationSchema);