import mongoose, { Schema, Document } from "mongoose";

export interface IGamification extends Document {
  user: mongoose.Types.ObjectId;
  // Streaks
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: Date;

  // Experience & Levels
  xp: number;
  level: number;

  // Badges
  badges: {
    badgeId: string;
    earnedAt: Date;
  }[];

  // Achievements (progress tracking)
  achievements: {
    achievementId: string;
    progress: number;
    isCompleted: boolean;
    completedAt?: Date;
  }[];

  leaderboardOptIn: boolean;
}

const gamificationSchema = new Schema<IGamification>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastActivityDate: { type: Date, default: Date.now },
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    badges: {
      type: [
        {
          badgeId: String,
          earnedAt: { type: Date, default: Date.now },
        },
      ],
      validate: [(val: any[]) => val.length <= 100, "Exceeds the limit of 100 badges"],
    },
    achievements: {
      type: [
        {
          achievementId: String,
          progress: { type: Number, default: 0 },
          isCompleted: { type: Boolean, default: false },
          completedAt: Date,
        },
      ],
      validate: [(val: any[]) => val.length <= 100, "Exceeds the limit of 100 achievements"],
    },
    leaderboardOptIn: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Gamification = mongoose.model<IGamification>("Gamification", gamificationSchema);
