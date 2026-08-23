import mongoose, { Document, Schema, Types } from "mongoose";

export interface IBlockedUser extends Document {
  blockedBy: Types.ObjectId;
  blockedUser: Types.ObjectId;
  reason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const blockedUserSchema = new Schema<IBlockedUser>(
  {
    blockedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    blockedUser: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    reason: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

blockedUserSchema.index(
  {
    blockedBy: 1,
    blockedUser: 1,
  },
  {
    unique: true,
  }
);

blockedUserSchema.index({
  blockedBy: 1,
});

blockedUserSchema.index({
  blockedUser: 1,
});

const BlockedUser = mongoose.model<IBlockedUser>("BlockedUser", blockedUserSchema);

export default BlockedUser;
