import mongoose from "mongoose";

const blockedUserSchema = new mongoose.Schema(
  {
    blockedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    blockedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    reason: {
      type: String,
      trim: true,
      default: ""
    }
  },
  {
    timestamps: true
  }
);

// Prevent duplicate block records
blockedUserSchema.index(
  {
    blockedBy: 1,
    blockedUser: 1
  },
  {
    unique: true
  }
);

// Get all users blocked by a user
blockedUserSchema.index({
  blockedBy: 1
});

// Check whether a specific user is blocked
blockedUserSchema.index({
  blockedUser: 1
});

export default mongoose.model("BlockedUser", blockedUserSchema);