import { Response } from "express";
import asyncHandler from "express-async-handler";
import Session from "../models/Session.js";
import { AuthenticatedRequest } from "../types/express.js";
import { User } from "../models/User.js";
import mongoose from "mongoose";
import { LEVEL_THRESHOLDS } from "../config/achievements.js";

/**
 * @desc Get overall progress metrics (total interviews, avg score, recent trend)
 * @route GET /api/analytics/progress
 */
export const getOverallProgress = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id || req.user?._id;
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const userObjectId = new mongoose.Types.ObjectId(userId.toString());

  const user = await User.findById(userId);
  const overallStats = await Session.aggregate([
    { $match: { user: userObjectId, status: "completed" } },
    {
      $group: {
        _id: null,
        totalSessions: { $sum: 1 },
        averageOverallScore: { $avg: "$overallScore" },
        averageTechnicalScore: { $avg: "$metrics.avgTechnical" },
        averageConfidenceScore: { $avg: "$metrics.avgConfidence" }
      }
    }
  ]);

  // 2. Progress over time (Scores by date)
  const progressOverTime = await Session.aggregate([
    { $match: { user: userObjectId, status: "completed" } },
    { $sort: { createdAt: 1 } },
    {
      $project: {
        date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        overallScore: 1,
        technicalScore: "$metrics.avgTechnical",
        confidenceScore: "$metrics.avgConfidence"
      }
    }
  ]);

  // 3. Performance by Role/Company
  const performanceByRole = await Session.aggregate([
    { $match: { user: userObjectId, status: "completed" } },
    {
      $group: {
        _id: "$role",
        sessionsCount: { $sum: 1 },
        avgScore: { $avg: "$overallScore" }
      }
    },
    { $sort: { avgScore: -1 } }
  ]);

  // 4. Speech metrics aggregates (if available)
  const speechMetrics = await Session.aggregate([
    { $match: { user: userObjectId, status: "completed" } },
    { $unwind: "$questions" },
    { $match: { "questions.speechMetrics": { $exists: true } } },
    {
      $group: {
        _id: null,
        avgPace: { $avg: "$questions.speechMetrics.speakingPaceWpm" },
        avgFillerWords: { $avg: "$questions.speechMetrics.fillerWordCount" },
        avgClarity: { $avg: "$questions.speechMetrics.clarityScore" },
      }
    }
  ]);

  let gamificationData = null;
  if (user) {
    const currentThreshold = LEVEL_THRESHOLDS.find(t => t.level === user.currentLevel);
    const nextThreshold = LEVEL_THRESHOLDS.find(t => t.level === user.currentLevel + 1);

    if (!currentThreshold) {
      res.status(400);
      throw new Error("Invalid gamification state: Current level threshold not found");
    }

    gamificationData = {
      xp: user.xp,
      currentLevel: user.currentLevel,
      currentTitle: currentThreshold.title,
      streakDays: user.streakDays,
      lastActiveDate: user.lastActiveDate,
      currentLevelXp: currentThreshold.xpRequired,
      nextLevelXp: nextThreshold ? nextThreshold.xpRequired : null,
    };
  }

  res.json({
    stats: overallStats[0] || {
      totalSessions: 0,
      averageOverallScore: 0,
      averageTechnicalScore: 0,
      averageConfidenceScore: 0
    },
    progress: progressOverTime,
    byRole: performanceByRole,
    speech: speechMetrics[0] || null,
    gamification: gamificationData
  });
});
