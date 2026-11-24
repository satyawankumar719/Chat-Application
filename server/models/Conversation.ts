import mongoose, { Schema, Types } from "mongoose";

export type MemberRole = "owner" | "admin" | "member";
export type ChatType = "direct" | "group";

export interface IChatMember {
  user: Types.ObjectId;
  role: MemberRole;
  joinedAt: Date;
}

export interface IChatAvatar {
  url?: string;
  publicId?: string;
}

export interface IChat  {
  type: ChatType;
  members: IChatMember[];
  name?: string;
  description?: string;
  avatar?: IChatAvatar;
  lastMessage?: Types.ObjectId;
  unreadCount?: Map<string, number>;
  createdBy: Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const memberSchema = new Schema<IChatMember>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    role: {
      type: String,
      enum: ["owner", "admin", "member"],
      default: "member",
    },

    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const chatSchema = new Schema<IChat>(
  {
    type: {
      type: String,
      enum: ["direct", "group"],
      default: "direct",
    },

    members: [memberSchema],

    name: {
      type: String,
      trim: true,
      default: "",
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    avatar: {
      url: String,
      publicId: String,
    },

    lastMessage: {
      type: Schema.Types.ObjectId,
      ref: "Message",
    },

    unreadCount: {
      type: Map,
      of: Number,
      default: {},
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

chatSchema.index({ "members.user": 1, isActive: 1, updatedAt: -1 });
chatSchema.index({ "members.user": 1 });
chatSchema.index({ updatedAt: -1 });
chatSchema.index({ type: 1, "members.user": 1 });

const Chat = mongoose.model<IChat>("Chat", chatSchema);

export default Chat;
