/**
 * @file models/User.ts
 * @description Mongoose User model with TypeScript support
 */

import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  googleId?: string;
  preferredRole: string;
  // --- Gamification fields (denormalized cache) ---
  // These fields mirror the Gamification model for quick access and efficient queries.
  // Updates to these fields MUST be handled atomically alongside Gamification records (see gamificationService.ts).
  // IMPORTANT: For repairing inconsistencies between Gamification and User records,
  // use the reconcile utility endpoint: POST /api/gamification/reconcile.
  xp: number;
  currentLevel: number;
  streakDays: number;
  lastActiveDate: Date;
  createdAt: Date;
  updatedAt: Date;
  matchPassword(password: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: function (this: any) {
        return !this.googleId;
      },
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    preferredRole: {
      type: String,
      default: "Full Stack Developer",
    },
    xp: {
      type: Number,
      default: 0,
    },
    currentLevel: {
      type: Number,
      default: 1,
    },
    streakDays: {
      type: Number,
      default: 0,
    },
    lastActiveDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Hash password before saving to the database.
 */
userSchema.pre("save", async function (this: IUser) {
  if (!this.isModified("password") || !this.password) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

/**
 * Compare entered password with the hashed password in the database.
 * @param {string} password - The plain text password to check.
 * @returns {Promise<boolean>}
 */
userSchema.methods.matchPassword = async function (
  this: IUser,
  password: string
): Promise<boolean> {
  if (!this.password) return false;
  return await bcrypt.compare(password, this.password);
};

export const User = mongoose.model<IUser>("User", userSchema);
