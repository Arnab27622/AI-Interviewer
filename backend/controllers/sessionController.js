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

    const io = req.app.get("io");
    res.status(201).json({
        message: "Session created successfully",
        sessionId: session._id,
        status: "processing"
    });

    // Background process for AI generation
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
            console.error("Error in createSession:", error.message);
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
    const sessions = await Session.find({ user: userId }).sort({ createdAt: -1 }).select("-questions");
    
    res.status(200).json({
        message: "Sessions retrieved successfully",
        session: sessions,
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
 * @desc Helper to handle transcription and evaluation in the background
 */
const evaluateAnswerAsync = async (io, userId, sessionId, questionIdx, codeSubmission, audioFilePath) => {
    try {
        const session = await Session.findById(sessionId);
        if (!session) throw new Error("Session not found");

        const question = session.questions[questionIdx];
        let transcription = "";

        if (audioFilePath) {
            try {
                pushSocketUpdate(io, userId, sessionId, "AI_TRANSCRIBING", `Transcribing answer...`);
                const audioBuffer = await fs.promises.readFile(audioFilePath);
                transcription = await aiService.transcribeAudio(audioBuffer);
            } catch (error) {
                console.error("Transcription Error:", error.message);
            } finally {
                if (fs.existsSync(audioFilePath)) await fs.promises.unlink(audioFilePath);
            }
        }

        pushSocketUpdate(io, userId, sessionId, "AI_EVALUATING", `Evaluating question ${questionIdx + 1}...`);

        const evaluation = await aiService.evaluateAnswer({
            question: question.questionText,
            question_type: question.questionType,
            user_answer: transcription || "No verbal answer provided.",
            user_code: codeSubmission || "",
            role: session.role,
            level: session.level,
            interview_type: session.interviewType,
        });

        question.userAnswerText = transcription;
        question.userSubmittedCode = codeSubmission || "";
        question.idealAnswer = evaluation.ideal_answer;
        question.technicalScore = evaluation.technical_score;
        question.confidenceScore = evaluation.confidence_score;
        question.aiFeedback = evaluation.ai_feedback;
        question.isEvaluated = true;
        question.isSubmitted = true;

        const allEvaluated = session.questions.every(q => q.isEvaluated);
        if (allEvaluated || session.status === "completed") {
            const scores = await Session.calculateScoreSummary(sessionId);
            session.overallScore = scores.overallScore;
            Object.assign(session.metrics, { avgTechnical: scores.avgTechnical, avgConfidence: scores.avgConfidence });
            
            if (allEvaluated) {
                session.status = "completed";
                session.endTime = session.endTime || Date.now();
            }
            await session.save();
            pushSocketUpdate(io, userId, sessionId, "session completed", "Evaluation complete", session);
        } else {
            await session.save();
            pushSocketUpdate(io, userId, sessionId, "evaluation completed", `Feedback for Q${questionIdx+1} ready`, session);
        }
    } catch (error) {
        console.error("Evaluation Async Task Error:", error.message);
        const errSession = await Session.findById(sessionId);
        if (errSession?.questions[questionIdx]) {
            errSession.questions[questionIdx].isSubmitted = false;
            await errSession.save();
        }
        pushSocketUpdate(io, userId, sessionId, "error", `Evaluation failed: ${error.message}`, errSession);
    }
};

/**
 * @desc Submit a question answer (code and/or audio)
 * @route POST /api/sessions/:sessionId/submit-answer
 */
export const submitAnswer = asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    const { questionIndex, code } = req.body;
    const userId = req.user.id;

    const session = await Session.findOne({ _id: sessionId, user: userId });
    if (!session) return res.status(404).json({ message: "Session not found" });

    const qIdx = parseInt(questionIndex);
    if (!session.questions[qIdx]) return res.status(404).json({ message: "Question not found" });

    session.questions[qIdx].isSubmitted = true;
    await session.save();

    res.status(200).json({ message: "Answer received" });

    const audioFilePath = req.file ? path.join(process.cwd(), req.file.path) : null;
    evaluateAnswerAsync(req.app.get("io"), userId, sessionId, qIdx, code, audioFilePath);
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