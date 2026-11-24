import mongoose ,{Document} from "mongoose";

export interface UserSchemaInterface extends Document {
  _id: any;
  id?: any;
  name: string;
  email: string;
  phoneNumber?: string;
  password: string | null;

  avatar: {
    url: string;
    publicId: string;
  };

  bio: string;
  isVerified: boolean;

  provider: "local" | "google";
  googleId?: string | null;

  isOnline: boolean;
  lastSeen: Date;

  role: "user" | "admin";

  createdAt?: Date;
  updatedAt?: Date;
}

const userSchema = new mongoose.Schema<UserSchemaInterface>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 50,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    phoneNumber: {
      type: String,
      unique: true,
      sparse: true,
      minlength: 10,
    },

    password: {
      type: String,
      default: null,
      minlength: 6,
    },

    avatar: {
      url: {
        type: String,
        default: "",
      },
      publicId: {
        type: String,
        default: "",
      },
    },

    bio: {
      type: String,
      default: "",
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    provider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },

    googleId: {
      type: String,
      default: null,
    },

    isOnline: {
      type: Boolean,
      default: false,
    },

    lastSeen: {
      type: Date,
      default: Date.now,
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
  },
  {
    timestamps: true,
  }
);

userSchema.index({
  isVerified: 1,
  name: 1,
  email: 1,
  phoneNumber: 1,
});

const User = mongoose.model<UserSchemaInterface>("User", userSchema);

export default User;