import mongoose from "mongoose";

const invitationSchema = new mongoose.Schema(
  {
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },

    type: {
      type: String,
      enum: ["direct", "group"],
      required: true
    },

    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      default: null
    },

    status: {
      type: String,
      enum: [
        "pending",
        "accepted",
        "declined",
        "expired"
      ],
      default: "pending"
    },

    token: {
      type: String,
      required: true,
      unique: true
    },

    message: {
      type: String,
      trim: true,
      default: ""
    },

    expiresAt: {
      type: Date,
      required: true
    }
  },
  {
    timestamps: true
  }
);

// Prevent duplicate pending invitations
invitationSchema.index(
  {
    email: 1,
    type: 1,
    status: 1
  },
  {
    unique: true,
    partialFilterExpression: {
      status: "pending"
    }
  }
);

// Lookup invitation by token


export default mongoose.model("Invitation", invitationSchema);