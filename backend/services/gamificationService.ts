import mongoose from "mongoose";
import { User } from "../models/User.js";
import Session from "../models/Session.js";
import { Gamification, IGamification } from "../models/Gamification.js";
import redisClient from "../config/redisConfig.js";
import { ACHIEVEMENTS, XP_REWARDS, LEVEL_THRESHOLDS } from "../config/achievements.js";

export const gamificationService = {
  async ensureGamificationRecord(userId: string): Promise<IGamification> {
    let record = await Gamification.findOne({ user: userId });
    if (!record) {
      // Migrate existing user data if necessary
      const user = await User.findById(userId);
      record = await Gamification.create({
        user: userId,
        xp: user?.xp || 0,
        level: user?.currentLevel || 1,
        currentStreak: user?.streakDays || 0,
        longestStreak: user?.streakDays || 0,
        lastActivityDate: user?.lastActiveDate || new Date(),
      });
    }
    return record;
  },

  async addXP(userId: string, reason: 'question_answered' | 'session_completed') {
    const xpAmount = reason === 'session_completed' ? XP_REWARDS.COMPLETE_INTERVIEW : XP_REWARDS.PERFECT_QUESTION;
    const redisKey = `user:${userId}:xp_buffer`;
    try {
      await redisClient.incrby(redisKey, xpAmount);
    } catch (error) {
      console.error("Redis addXP failed:", error);
      throw error;
    }
  },

  async flushXPToMongo(userId: string) {
    const redisKey = `user:${userId}:xp_buffer`;

    // Atomically get and delete to prevent race conditions
    const multiResult = await redisClient.multi().get(redisKey).del(redisKey).exec();
    const bufferedXPStr = multiResult ? multiResult[0][1] as string : null;

    const record = await this.ensureGamificationRecord(userId);

    let bufferedXP = 0;
    if (bufferedXPStr && parseInt(bufferedXPStr, 10) > 0) {
      bufferedXP = parseInt(bufferedXPStr, 10);
      record.xp += bufferedXP;
    }

    // Run deep achievement check (XP rewards added before leveling)
    const newlyEarnedBadges = await this.checkAndAwardBadges(userId, record);

    if (bufferedXP > 0) {
      const firstInterview = record.achievements.find(a => a.achievementId === ACHIEVEMENTS.FIRST_INTERVIEW.id);
      if (!firstInterview) {
        record.achievements.push({
          achievementId: ACHIEVEMENTS.FIRST_INTERVIEW.id,
          progress: 1,
          isCompleted: true,
          completedAt: new Date()
        });
        record.badges.push({ badgeId: ACHIEVEMENTS.FIRST_INTERVIEW.id, earnedAt: new Date() });
        newlyEarnedBadges.push(ACHIEVEMENTS.FIRST_INTERVIEW.id);
        record.xp += XP_REWARDS.BADGE_EARNED;
      }
    }

    // Calculate level
    let newLevel = 1;
    for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
      if (record.xp >= LEVEL_THRESHOLDS[i].xpRequired) {
        newLevel = LEVEL_THRESHOLDS[i].level;
        break;
      }
    }

    let leveledUp = false;
    if (newLevel > record.level) {
      record.level = newLevel;
      leveledUp = true;
    }

    await record.save();

    // Sync to User model for backward compatibility
    await User.updateOne({ _id: userId }, {
      $set: { xp: record.xp, currentLevel: record.level, streakDays: record.currentStreak, lastActiveDate: record.lastActivityDate }
    });

    return {
      xpAdded: bufferedXP,
      totalXP: record.xp,
      newLevel: record.level,
      leveledUp,
      newlyEarnedBadges
    };
  },

  async checkAndAwardBadges(userId: string, record: IGamification): Promise<string[]> {
    const newlyEarned: string[] = [];
    const aggResult = await Session.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId), status: 'completed' } },
      {
        $project: {
          hasPerfectScore: {
            $gt: [
              {
                $size: {
                  $filter: {
                    input: "$questions",
                    as: "q",
                    cond: { $and: [{ $eq: ["$$q.technicalScore", 100] }, { $eq: ["$$q.confidenceScore", 100] }] }
                  }
                }
              },
              0
            ]
          },
          hasSystemDesign: {
            $gt: [
              {
                $size: {
                  $filter: {
                    input: "$questions",
                    as: "q",
                    cond: { $and: [{ $eq: ["$$q.questionType", "system-design"] }, { $eq: ["$$q.isEvaluated", true] }] }
                  }
                }
              },
              0
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          anyPerfectScore: { $max: "$hasPerfectScore" },
          anySystemDesign: { $max: "$hasSystemDesign" }
        }
      }
    ]);

    const count = aggResult.length > 0 ? aggResult[0].count : 0;
    const hasPerfectScore = aggResult.length > 0 ? aggResult[0].anyPerfectScore : false;
    const hasSystemDesign = aggResult.length > 0 ? aggResult[0].anySystemDesign : false;

    const checkBadge = (achievementDef: any, condition: boolean) => {
      const existing = record.achievements.find(a => a.achievementId === achievementDef.id);
      if (!existing && condition) {
        record.achievements.push({
          achievementId: achievementDef.id,
          progress: achievementDef.target,
          isCompleted: true,
          completedAt: new Date()
        });
        record.badges.push({ badgeId: achievementDef.id, earnedAt: new Date() });
        newlyEarned.push(achievementDef.id);
        record.xp += XP_REWARDS.BADGE_EARNED;
      }
    };

    // Milestone Badges
    checkBadge(ACHIEVEMENTS.INTERVIEW_10, count >= 10);
    checkBadge(ACHIEVEMENTS.INTERVIEW_50, count >= 50);

    checkBadge(ACHIEVEMENTS.PERFECT_SCORE, hasPerfectScore);
    checkBadge(ACHIEVEMENTS.SYSTEM_DESIGNER, hasSystemDesign);

    // Streak Badges
    checkBadge(ACHIEVEMENTS.STREAK_3, record.longestStreak >= 3);
    checkBadge(ACHIEVEMENTS.STREAK_7, record.longestStreak >= 7);
    checkBadge(ACHIEVEMENTS.STREAK_30, record.longestStreak >= 30);

    return newlyEarned;
  },

  async updateStreak(userId: string) {
    const record = await this.ensureGamificationRecord(userId);

    const now = new Date();
    const lastActive = new Date(record.lastActivityDate);

    now.setHours(0, 0, 0, 0);
    lastActive.setHours(0, 0, 0, 0);

    const diffTime = now.getTime() - lastActive.getTime();

    if (diffTime < 0) {
      console.warn(`Time anomaly detected: lastActive in the future for user ${userId}. Resetting streak.`);
      record.currentStreak = 1;
      record.lastActivityDate = new Date();
      await record.save();
      await User.updateOne({ _id: userId }, {
        $set: { streakDays: record.currentStreak, lastActiveDate: record.lastActivityDate }
      });
      return { streakDays: record.currentStreak };
    }

    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      record.currentStreak += 1;
      if (record.currentStreak > record.longestStreak) {
        record.longestStreak = record.currentStreak;
      }
    } else if (diffDays > 1) {
      record.currentStreak = 1;
    } else if (diffDays === 0 && record.currentStreak === 0) {
      record.currentStreak = 1;
      if (record.currentStreak > record.longestStreak) {
        record.longestStreak = record.currentStreak;
      }
    }

    record.lastActivityDate = new Date();
    await record.save();

    await User.updateOne({ _id: userId }, {
      $set: { streakDays: record.currentStreak, lastActiveDate: record.lastActivityDate }
    });

    return { streakDays: record.currentStreak };
  },

  async getProfile(userId: string) {
    return await this.ensureGamificationRecord(userId);
  },

  async getLeaderboard(limit: number = 50) {
    return await Gamification.find({ leaderboardOptIn: true })
      .sort({ xp: -1 })
      .limit(limit)
      .populate('user', 'name');
  }
};
