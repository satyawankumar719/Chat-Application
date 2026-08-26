import mongoose, { Schema, Types } from "mongoose";

export type InvitationType = "direct" | "group";
export type InvitationStatus = "pending" | "accepted" | "rejected" | "expired";

export interface IInvitation {
  invitedBy: Types.ObjectId;
  receiver: Types.ObjectId;
  type: InvitationType;
  group?: Types.ObjectId | null;
  status: InvitationStatus;
  message?: string;
  rejectedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const invitationSchema = new Schema<IInvitation>(
  {
    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    receiver: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    type: {
      type: String,
      enum: ["direct", "group"],
      default: "direct",
    },

    group: {
      type: Schema.Types.ObjectId,
      ref: "Chat",
      default: null,
    },

    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "expired"],
      default: "pending",
    },

    message: {
      type: String,
      trim: true,
      default: "",
    },

    rejectedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

invitationSchema.index({ invitedBy: 1, receiver: 1 });
invitationSchema.index({ receiver: 1, status: 1 });

const Invitation = mongoose.model<IInvitation>("Invitation", invitationSchema);

export default Invitation;
