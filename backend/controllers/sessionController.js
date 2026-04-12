import asyncHandler from "express-async-handler";
import Session from "../models/SessionModel.js";
import fs from "fs";
import path from "path";
import { aiService } from "../services/aiService.js";
import { pushSocketUpdate } from "../services/socketService.js";

/**
 * @desc Create a new interview session and trigger AI question generation
 * @route POST /api/sessions
 */
export const createSession = asyncHandler(async (req, res) => {
    const { role, level, interviewType, count } = req.body;
    const userId = req.user.id;
    const io = req.app.get("io");

    if (!userId || !role || !level || !interviewType || !count) {
        return res.status(400).json({ message: "All fields are required" });
    }

    const session = await Session.create({
        user: userId,
        role,
        level,
        interviewType,
        status: "pending",
    });

    res.status(201).json({
        message: "Session created successfully",
        sessionId: session._id,
        status: "processing"
    });

    // Background process for AI generation:
    // We trigger this immediately and respond to the user with "processing"
    // to avoid blocking the HTTP response during slow AI generation calls.
    (async () => {
        try {
            pushSocketUpdate(io, userId, session._id, "AI_GENERATING", `Generating ${count} questions for ${role}...`);

            const aiData = await aiService.generateQuestions({ role, level, interviewType, count });
            const codingCount = interviewType === 'coding-mix' ? Math.floor(count * 0.2) : 0;

            const questions = (aiData.questions || []).map((qInfo, index) => ({
                questionText: qInfo.question,
                idealAnswer: qInfo.ideal_answer,
                questionType: index < codingCount ? "coding" : "oral",
                isEvaluated: false,
                isSubmitted: false,
            }));

            session.questions = questions;
            session.status = "in-progress";
            session.startTime = new Date();
            await session.save();

            pushSocketUpdate(io, userId, session._id, "QUESTIONS_READY", "Starting Interview...", session);
        } catch (error) {
            console.error("Error in createSession (Background):", error.message);
            session.status = "failed";
            await session.save();
            pushSocketUpdate(io, userId, session._id, "GENERATION_FAILED", "Failed to generate questions", { error: error.message });
        }
    })();
});

/**
 * @desc Get all interview sessions for the logged-in user
 * @route GET /api/sessions
 */
export const getSession = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    
    // Pagination defaults
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const totalSessions = await Session.countDocuments({ user: userId });

    const sessions = await Session.find({ user: userId })
        .sort({ createdAt: -1 })
        .select("-questions") // Exclude heavy question data for the list view
        .skip(skip)
        .limit(limit);
    
    res.status(200).json({
        message: "Sessions retrieved successfully",
        session: sessions,
        pagination: {
            totalSessions,
            totalPages: Math.ceil(totalSessions / limit),
            currentPage: page,
            pageSize: limit
        }
    });
});

/**
 * @desc Get a specific interview session by ID
 * @route GET /api/sessions/:sessionId
 */
export const getSessionById = asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    const userId = req.user.id;

    const session = await Session.findOne({ _id: sessionId, user: userId });
    if (!session) return res.status(404).json({ message: "Session not found" });

    res.status(200).json({ message: "Session found", session });
});

/**
 * @desc Delete an interview session
 * @route DELETE /api/sessions/:sessionId
 */
export const deleteSession = asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    const userId = req.user.id;

    const session = await Session.findOne({ _id: sessionId, user: userId });
    if (!session) return res.status(404).json({ message: "Session not found" });

    await session.deleteOne();
    res.status(200).json({ id: session._id, message: "Session deleted successfully" });
});

/**
 * @desc Helper to handle transcription and evaluation in the background.
 * This runs after the initial "Answer received" response to keep UI snappy.
 */
const evaluateAnswerAsync = async (io, userId, sessionId, questionIdx, codeSubmission, language, audioFilePath) => {
    try {
        const session = await Session.findById(sessionId);
        if (!session) throw new Error("Session not found");

        const question = session.questions[questionIdx];
        let transcription = "";

        // Stage 1: Transcription (if audio exists)
        if (audioFilePath) {
            try {
                pushSocketUpdate(io, userId, sessionId, "AI_TRANSCRIBING", `Transcribing answer...`);
                const audioBuffer = await fs.promises.readFile(audioFilePath);
                transcription = await aiService.transcribeAudio(audioBuffer);
            } catch (error) {
                console.error("Transcription Error:", error.message);
            } finally {
                // Ensure temp file is deleted even if transcription fails
                if (fs.existsSync(audioFilePath)) {
                    await fs.promises.unlink(audioFilePath).catch(err => console.error("Error unlinking file:", err));
                }
            }
        }

        // Stage 2: AI Evaluation
        pushSocketUpdate(io, userId, sessionId, "AI_EVALUATING", `Evaluating question ${questionIdx + 1}...`);

        const evaluation = await aiService.evaluateAnswer({
            question: question.questionText,
            question_type: question.questionType,
            user_answer: transcription || "No verbal answer provided.",
            user_code: codeSubmission || "",
            selected_language: language || "plaintext",
            role: session.role,
            level: session.level,
            interview_type: session.interviewType,
        });

        // Stage 3: Atomic Update
        // We use findOneAndUpdate with $set to avoid overwriting other fields 
        // that might have changed since we first loaded the session.
        const updatedSession = await Session.findOneAndUpdate(
            { _id: sessionId },
            {
                $set: {
                    [`questions.${questionIdx}.userAnswerText`]: transcription,
                    [`questions.${questionIdx}.userSubmittedCode`]: codeSubmission || "",
                    [`questions.${questionIdx}.idealAnswer`]: evaluation.ideal_answer,
                    [`questions.${questionIdx}.technicalScore`]: evaluation.technical_score,
                    [`questions.${questionIdx}.confidenceScore`]: evaluation.confidence_score,
                    [`questions.${questionIdx}.aiFeedback`]: evaluation.ai_feedback,
                    [`questions.${questionIdx}.isEvaluated`]: true,
                    [`questions.${questionIdx}.isSubmitted`]: true,
                }
            },
            { returnDocument: 'after' }
        );

        if (!updatedSession) throw new Error("Failed to update session during evaluation");

        // Check if this was the last question
        const allEvaluated = updatedSession.questions.every(q => q.isEvaluated);
        if (allEvaluated || updatedSession.status === "completed") {
            const scores = await Session.calculateScoreSummary(sessionId);
            
            const finalUpdate = {
                overallScore: scores.overallScore,
                "metrics.avgTechnical": scores.avgTechnical,
                "metrics.avgConfidence": scores.avgConfidence,
            };

            if (allEvaluated) {
                finalUpdate.status = "completed";
                finalUpdate.endTime = updatedSession.endTime || Date.now();
            }

            const finalSession = await Session.findOneAndUpdate(
                { _id: sessionId },
                { $set: finalUpdate },
                { returnDocument: 'after' }
            );

            pushSocketUpdate(io, userId, sessionId, "session completed", "Evaluation complete", finalSession);
        } else {
            pushSocketUpdate(io, userId, sessionId, "evaluation completed", `Feedback for Q${questionIdx+1} ready`, updatedSession);
        }
    } catch (error) {
        console.error("Evaluation Async Task Error:", error.message);
        
        // Revert isSubmitted flag on error so the user can try again
        const errSession = await Session.findOneAndUpdate(
            { _id: sessionId, [`questions.${questionIdx}.isEvaluated`]: false },
            { $set: { [`questions.${questionIdx}.isSubmitted`]: false } },
            { returnDocument: 'after' }
        );
        
        pushSocketUpdate(io, userId, sessionId, "error", `Evaluation failed: ${error.message}`, errSession);
    }
};

/**
 * @desc Submit a question answer (code and/or audio)
 * @route POST /api/sessions/:sessionId/submit-answer
 */
export const submitAnswer = asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    const { questionIndex, code, language } = req.body;
    const userId = req.user.id;

    const session = await Session.findOne({ _id: sessionId, user: userId });
    if (!session) return res.status(404).json({ message: "Session not found" });

    const qIdx = parseInt(questionIndex);
    if (!session.questions[qIdx]) return res.status(404).json({ message: "Question not found" });

    // Mark as submitted immediately to prevent duplicate submissions
    session.questions[qIdx].isSubmitted = true;
    await session.save();

    res.status(200).json({ message: "Answer received" });

    // Offload actual AI work to the background task
    const audioFilePath = req.file ? path.join(process.cwd(), req.file.path) : null;
    evaluateAnswerAsync(req.app.get("io"), userId, sessionId, qIdx, code, language, audioFilePath);
});

/**
 * @desc Manually end an interview session
 * @route POST /api/sessions/:sessionId/end
 */
export const endSession = asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    const userId = req.user.id;

    const session = await Session.findOne({ _id: sessionId, user: userId });
    if (!session) return res.status(404).json({ message: "Session not found" });

    // Prevent ending if answers are still being transcribed/evaluated
    if (session.questions.some(q => !q.isEvaluated && q.isSubmitted)) {
        return res.status(400).json({ message: "Evaluation in progress, please wait." });
    }

    const scores = await Session.calculateScoreSummary(sessionId);
    session.overallScore = scores.overallScore;
    Object.assign(session.metrics, { avgTechnical: scores.avgTechnical, avgConfidence: scores.avgConfidence });
    session.status = "completed";
    session.endTime = Date.now();
    await session.save();

    pushSocketUpdate(req.app.get("io"), userId, sessionId, "session completed", "Session ended", session);
    res.status(200).json({ message: "Session ended", session });
});