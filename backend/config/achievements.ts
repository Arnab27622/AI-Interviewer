export const ACHIEVEMENTS = {
  // Milestone badges
  FIRST_INTERVIEW: { id: "first_interview", name: "First Step", desc: "Complete your first interview", target: 1, category: "milestone" },
  INTERVIEW_10: { id: "interview_10", name: "Interviewer", desc: "Complete 10 interviews", target: 10, category: "milestone" },
  INTERVIEW_50: { id: "interview_50", name: "Seasoned Pro", desc: "Complete 50 interviews", target: 50, category: "milestone" },

  // Streak badges
  STREAK_3: { id: "streak_3", name: "Getting Started", desc: "3-day practice streak", target: 3, category: "engagement" },
  STREAK_7: { id: "streak_7", name: "Consistent", desc: "7-day practice streak", target: 7, category: "engagement" },
  STREAK_30: { id: "streak_30", name: "Unstoppable", desc: "30-day practice streak", target: 30, category: "engagement" },

  // Skill badges
  PERFECT_SCORE: { id: "perfect_score", name: "Perfect Score", desc: "Score 100 on any interview", target: 1, category: "skill" },
  SYSTEM_DESIGNER: { id: "system_designer", name: "Architect", desc: "Complete 1 system design interview", target: 1, category: "special" },
};

export const XP_REWARDS = {
  COMPLETE_INTERVIEW: 200,
  PERFECT_QUESTION: 50,
  STREAK_BONUS_DAY: 10,
  STREAK_MILESTONE: { 3: 50, 7: 150, 30: 500 },
  FIRST_OF_DAY: 20,
  BADGE_EARNED: 200,
};

export const LEVEL_THRESHOLDS = [
  { level: 1, xpRequired: 0, title: "Novice" },
  { level: 2, xpRequired: 200, title: "Apprentice" },
  { level: 3, xpRequired: 500, title: "Practitioner" },
  { level: 4, xpRequired: 1000, title: "Intermediate" },
  { level: 5, xpRequired: 2000, title: "Advanced" },
  { level: 6, xpRequired: 3500, title: "Expert" },
  { level: 7, xpRequired: 5000, title: "Master" },
  { level: 8, xpRequired: 7500, title: "Grandmaster" },
  { level: 9, xpRequired: 10000, title: "Legend" },
  { level: 10, xpRequired: 15000, title: "Titan" },
];
