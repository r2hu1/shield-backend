import mongoose, { Model } from "mongoose";
import Pwd from "./password";
import { hashPassword } from "~/utils/crypto";
const { model, models, Schema } = mongoose;

export interface IUser {
  email: string;
  password: string;
  status?: string;
  savedPasswords?: mongoose.Types.ObjectId[];
}

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      default: "unverified",
    },
    savedPasswords: [
      {
        type: Schema.Types.ObjectId,
        ref: "Pwd",
      },
    ],
  },
  {
    timestamps: true,
  },
);

userSchema.pre("save", async function (next) {
  const emailExists = await (User as Model<IUser>).findOne({
    email: this.email,
  });
  if (emailExists) {
    throw new Error("Email already exists");
  }
  next();
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  if (this.password.length < 8) {
    throw new Error("Password must be at least 8 characters long");
  }
  if (this.password.includes("password")) {
    throw new Error("Password cannot contain the word 'password'");
  }
  if (this.password.includes("12345678")) {
    throw new Error("Password cannot contain the word '12345678'");
  }
  this.password = await hashPassword(this.password);
});

userSchema.pre("findOneAndDelete", async function (next) {
  const doc = await this.model.findOne(this.getFilter());
  if (doc) {
    await Pwd.deleteMany({ _id: { $in: doc.savedPasswords } });
  }
  next();
});

const User = models.User || model("User", userSchema);
export default User;
