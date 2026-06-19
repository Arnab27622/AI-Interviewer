import fs from "fs";
import Session from "../models/Session.js";
import { Resume } from "../models/Resume.js";
import { aiService } from "./aiService.js";
import { pushSocketUpdate } from "./socketService.js";
import { gamificationService } from "./gamificationService.js";

export const sessionService = {
  async createInterviewSession(
    userId: string | any,
    role: string,
    level: string,
    interviewType: string,
    count: number,
    company: string | undefined,
    companyTrack: string | undefined,
    resumeId: string | undefined,
    io: any
  ) {
    const session = await Session.create({
      user: userId,
      role,
      level,
      interviewType,
      company,
      companyTrack,
      resumeId,
      status: "pending",
    });

    // Background process for AI generation
    (async () => {
      try {
        pushSocketUpdate(
          io,
          userId.toString(),
          session._id.toString(),
          "AI_GENERATING",
          `Generating ${count} questions for ${role}...`
        );

        let resumeText = undefined;
        if (resumeId && /^[0-9a-fA-F]{24}$/.test(resumeId)) {
          try {
            const resume = await Resume.findById(resumeId);
            if (resume) {
              resumeText = resume.parsedData?.rawText;
              // Or extract projects specifically if you prefer, but rawText gives full context
              if (!resumeText && resume.analysisReport?._v2?.report?.recruiter_summary) {
                resumeText = resume.analysisReport._v2.report.recruiter_summary;
              }
            }
          } catch (err: any) {
            console.error("Error fetching resume for session:", err.message);
          }
        }

        const aiData = await aiService.generateQuestions({
          role,
          level,
          interviewType,
          count,
          resumeText,
        });
        const questions = (aiData.questions || []).map((qInfo: any) => ({
          questionText: qInfo.question,
          idealAnswer: qInfo.ideal_answer,
          questionType: ["coding", "system-design"].includes(qInfo.question_type) ? qInfo.question_type : "oral",
          isEvaluated: false,
          isSubmitted: false,
        }));

        session.questions = questions as any;
        session.status = "in-progress";
        session.startTime = new Date();
        await session.save();

        pushSocketUpdate(
          io,
          userId.toString(),
          session._id.toString(),
          "QUESTIONS_READY",
          "Starting Interview...",
          session
        );
      } catch (error: any) {
        console.error("Error in createSession (Background):", error.message);
        session.status = "failed";
        await session.save();
        pushSocketUpdate(
          io,
          userId.toString(),
          session._id.toString(),
          "GENERATION_FAILED",
          "Failed to generate questions",
          { error: error.message }
        );
      }
    })();

    return session;
  },

  async getSessionsForUser(userId: string | any, page: number, limit: number) {
    const skip = (page - 1) * limit;

    const totalSessions = await Session.countDocuments({ user: userId });
    const completedSessionsCount = await Session.countDocuments({
      user: userId,
      status: "completed",
    });

    const sessions = await Session.find({ user: userId })
      .sort({ createdAt: -1 })
      .select("-questions") // Exclude heavy question data for the list view
      .skip(skip)
      .limit(limit);

    return {
      sessions,
      pagination: {
        totalSessions,
        totalPages: Math.ceil(totalSessions / limit),
        currentPage: page,
        pageSize: limit,
      },
      stats: {
        totalSessions,
        completedSessions: completedSessionsCount,
        activeSessions: totalSessions - completedSessionsCount,
      },
    };
  },

  async getSessionDetails(sessionId: string, userId: string | any) {
    const session = await Session.findOne({ _id: sessionId, user: userId });
    if (!session) {
      throw new Error("Session not found");
    }
    return session;
  },

  async deleteInterviewSession(sessionId: string, userId: string | any) {
    const session = await Session.findOne({ _id: sessionId, user: userId });
    if (!session) {
      throw new Error("Session not found");
    }

    if (session.status === "pending") {
      throw new Error("Cannot delete a session while questions are being generated.");
    }

    await session.deleteOne();
    return session._id;
  },

  async submitSessionAnswer(
    sessionId: string,
    userId: string | any,
    questionIndex: string,
    code: string | null,
    language: string | null,
    audioFilePath: string | null,
    diagramImageUrl: string | null,
    io: any
  ) {
    const session = await Session.findOne({ _id: sessionId, user: userId });
    if (!session) {
      throw new Error("Session not found");
    }

    const qIdx = parseInt(questionIndex, 10);
    if (!session.questions[qIdx]) {
      throw new Error("Question not found");
    }

    // Mark as submitted immediately to prevent duplicate submissions
    session.questions[qIdx].isSubmitted = true;
    await session.save();

    this.evaluateAnswerAsync(
      io,
      userId.toString(),
      sessionId,
      qIdx,
      code,
      language,
      audioFilePath,
      diagramImageUrl
    );
  },

  async evaluateAnswerAsync(
    io: any,
    userId: string,
    sessionId: string,
    questionIdx: number,
    codeSubmission: string | null,
    language: string | null,
    audioFilePath: string | null,
    diagramImageUrl: string | null
  ) {
    try {
      const session = await Session.findById(sessionId);
      if (!session) throw new Error("Session not found");

      const question = session.questions[questionIdx];
      if (!question) throw new Error("Question not found");

      let speechMetrics: any = null;
      let transcription = "";

      // Stage 1: Transcription & Speech Analysis (if audio exists)
      if (audioFilePath) {
        try {
          pushSocketUpdate(io, userId, sessionId, "AI_TRANSCRIBING", `Analyzing speech patterns...`);
          const audioBuffer = await fs.promises.readFile(audioFilePath);

          const analysisResult = await aiService.analyzeSpeech(audioBuffer);
          transcription = analysisResult.transcript || "";
          speechMetrics = analysisResult.metrics || null;
        } catch (error: any) {
          console.error("Speech Analysis/Transcription Error:", error.message);
        } finally {
          // Ensure temp file is deleted even if transcription fails
          if (fs.existsSync(audioFilePath)) {
            await fs.promises.unlink(audioFilePath).catch((err) =>
              console.error("Error unlinking file:", err)
            );
          }
        }
      }

      // Stage 2: AI Evaluation
      pushSocketUpdate(io, userId, sessionId, "AI_EVALUATING", `Evaluating question ${questionIdx + 1}...`);

      const evaluation = await aiService.evaluateAnswer({
        question: question.questionText,
        question_type: question.questionType as "coding" | "oral" | "system-design",
        user_answer: transcription || "No verbal answer provided.",
        user_code: codeSubmission || "",
        selected_language: language || "plaintext",
        diagram_payload: diagramImageUrl || undefined,
        role: session.role,
        level: session.level,
        interview_type: session.interviewType,
      });

      const updateFields: any = {
        [`questions.${questionIdx}.userAnswerText`]: transcription,
        [`questions.${questionIdx}.userSubmittedCode`]: codeSubmission || "",
        [`questions.${questionIdx}.diagramImageUrl`]: diagramImageUrl || "",
        [`questions.${questionIdx}.idealAnswer`]: evaluation.ideal_answer,
        [`questions.${questionIdx}.technicalScore`]: evaluation.technical_score,
        [`questions.${questionIdx}.confidenceScore`]: evaluation.confidence_score,
        [`questions.${questionIdx}.aiFeedback`]: evaluation.ai_feedback,
        [`questions.${questionIdx}.isEvaluated`]: true,
        [`questions.${questionIdx}.isSubmitted`]: true,
      };

      if (speechMetrics) {
        const PACE_SLOW = 110;
        const PACE_FAST = 160;
        const CLARITY_FILLER_PENALTY = 2;
        const CLARITY_PAUSE_PENALTY = 1.5;

        updateFields[`questions.${questionIdx}.speechMetrics`] = {
          fillerWordCount: speechMetrics.filler_words_count || 0,
          fillerWords: [],
          speakingPaceWpm: speechMetrics.pace_wpm || 0,
          paceRating: (speechMetrics.pace_wpm < PACE_SLOW) ? 'Slow' : (speechMetrics.pace_wpm > PACE_FAST) ? 'Fast' : 'Good',
          totalPauseDurationMs: (speechMetrics.pause_time_seconds || 0) * 1000,
          pauseCount: speechMetrics.pause_count || 0,
          clarityScore: Math.max(0, 100 - ((speechMetrics.filler_words_count || 0) * CLARITY_FILLER_PENALTY) - ((speechMetrics.pause_count || 0) * CLARITY_PAUSE_PENALTY)),
        };
      }

      // Stage 3: Atomic Update
      const updatedSession = await Session.findOneAndUpdate(
        { _id: sessionId },
        { $set: updateFields },
        { returnDocument: "after" }
      );

      if (!updatedSession) throw new Error("Failed to update session during evaluation");

      // Add XP for answering a question
      try {
        await gamificationService.addXP(userId, 'question_answered');
      } catch (err) {
        console.error(`[Gamification] Failed to add XP for question:`, err);
      }

      // Check if this was the last question
      const allEvaluated = updatedSession.questions.every((q: any) => q.isEvaluated);
      if (allEvaluated || updatedSession.status === "completed") {
        const scores = await Session.calculateScoreSummary(sessionId);

        const finalUpdate: Record<string, any> = {
          overallScore: scores.overallScore,
          "metrics.avgTechnical": scores.avgTechnical,
          "metrics.avgConfidence": scores.avgConfidence,
        };

        if (allEvaluated) {
          finalUpdate.status = "completed";
          finalUpdate.endTime = updatedSession.endTime || new Date();
        }

        const finalSession = await Session.findOneAndUpdate(
          { _id: sessionId },
          { $set: finalUpdate },
          { returnDocument: "after" }
        );

        // Add session completion XP and flush all buffered XP to MongoDB
        let levelUpInfo = null;
        try {
          await gamificationService.addXP(userId, 'session_completed');
          await gamificationService.updateStreak(userId);
          levelUpInfo = await gamificationService.flushXPToMongo(userId);
        } catch (err) {
          console.error(`[Gamification] Failed to flush XP on session completion:`, err);
        }

        // Include gamification updates in the socket payload
        if (finalSession) {
          const payload = { ...finalSession.toObject(), gamification: levelUpInfo };

          pushSocketUpdate(
            io,
            userId,
            sessionId,
            "session completed",
            "Evaluation complete",
            payload
          );
        }
      } else {
        pushSocketUpdate(
          io,
          userId,
          sessionId,
          "evaluation completed",
          `Feedback for Q${questionIdx + 1} ready`,
          updatedSession
        );
      }
    } catch (error: any) {
      console.error("Evaluation Async Task Error:", error.message);

      // Revert isSubmitted flag on error so the user can try again
      const errSession = await Session.findOneAndUpdate(
        { _id: sessionId, [`questions.${questionIdx}.isEvaluated`]: false },
        { $set: { [`questions.${questionIdx}.isSubmitted`]: false } },
        { returnDocument: "after" }
      );

      pushSocketUpdate(
        io,
        userId,
        sessionId,
        "error",
        `Evaluation failed: ${error.message}`,
        errSession
      );
    }
  },

  async endInterviewSession(sessionId: string, userId: string | any, io: any) {
    const session = await Session.findOne({ _id: sessionId, user: userId });
    if (!session) {
      throw new Error("Session not found");
    }

    // Prevent ending if answers are still being transcribed/evaluated
    if (session.questions.some((q: any) => !q.isEvaluated && q.isSubmitted)) {
      throw new Error("Evaluation in progress, please wait.");
    }

    const scores = await Session.calculateScoreSummary(sessionId);
    session.overallScore = scores.overallScore;
    session.metrics = {
      avgTechnical: scores.avgTechnical,
      avgConfidence: scores.avgConfidence,
    };
    session.status = "completed";
    session.endTime = new Date();
    await session.save();

    let levelUpInfo = null;
    try {
      await gamificationService.addXP(userId.toString(), 'session_completed');
      await gamificationService.updateStreak(userId.toString());
      levelUpInfo = await gamificationService.flushXPToMongo(userId.toString());
    } catch (err) {
      console.error(`[Gamification] Failed to flush XP on manual session completion:`, err);
    }

    pushSocketUpdate(
      io,
      userId.toString(),
      sessionId,
      "session completed",
      "Session ended",
      { ...session.toObject(), gamification: levelUpInfo }
    );

    return session;
  },
};
