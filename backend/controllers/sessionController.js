import asyncHandler from "express-async-handler";
import Session from "../models/SessionModel.js";
import fetch from "node-fetch";
import fs from "fs";
import FormData from "form-data";
import path from "path";
import mongoose from "mongoose";

const API_SERVICE_URL = "http://localhost:8000";

const pushSocketUpdate = (io, userId, sessionId, status, message, session = null) => {
    io.to(userId.toString()).emit("sessionUpdate", {
        sessionId,
        status,
        message,
        session
    });
}

const createSession = asyncHandler(async (req, res) => {
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
        // status: session.status,
        status: "processing"
    });

    (async () => {
        try {
            pushSocketUpdate(io, userId, session._id, "AI_GENERATING", `Generating ${count} questions for ${role} role ${level} level interview ...`);

            const aiResponse = await fetch(`${API_SERVICE_URL}/generate-questions`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    role,
                    level,
                    interviewType,
                    count,
                }),
            });

            if (!aiResponse.ok) {
                const errorData = await aiResponse.json();
                throw new Error(`Failed to generate questions: ${aiResponse.status} - ${errorData.error || "Unknown error"}`);
            }

            const aiData = await aiResponse.json();
            const codingCount = interviewType === 'coding-mix' ? Math.floor(count * 0.2) : 0;

            const questions = (aiData.questions || aiData.question || []).map((qText, index) => ({
                questionText: qText,
                questionType: index < codingCount ? "coding" : "oral",
                isEvaluated: false,
                isSubmitted: false,
                // idealAnswer: q.ideal_answer,
                // technicalScore: 0,
                // confidenceScore: 0,
                // aiFeedback: "",
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
            pushSocketUpdate(io, userId, session._id, "GENERATION_FAILED", "Failed to generate questions", {
                error: error.message,
            });
        }
    })();
});

const getSession = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
    }

    const session = await Session.find({
        user: userId,
    }).sort({ createdAt: -1 }).select("-questions");

    if (!session) {
        return res.status(404).json({ message: "Session not found" });
    }

    res.status(200).json({
        message: "Session found successfully",
        session,
    });
});

const getSessionById = asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    const userId = req.user.id;

    if (!sessionId) {
        return res.status(400).json({ message: "Session ID is required" });
    }

    const session = await Session.findOne({
        _id: sessionId,
        user: userId,
    });

    if (!session) {
        return res.status(404).json({ message: "Session not found" });
    }

    res.status(200).json({
        message: "Session found successfully",
        session,
    });
});

const deleteSession = asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    const userId = req.user.id;

    if (!sessionId) {
        return res.status(400).json({ message: "Session ID is required" });
    }

    const session = await Session.findOne({
        _id: sessionId,
        user: userId,
    });

    if (!session) {
        return res.status(404).json({ message: "Session not found" });
    }

    await session.deleteOne();

    res.status(200).json({
        id: session._id,
        message: "Session deleted successfully",
    });
});

const calculateScoreSummary = async (sessionId) => {
    const result = await Session.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(sessionId),
            },
        },
        {
            $unwind: "$questions",
        },
        {
            $group: {
                _id: "$_id",
                avgTechnical: { $avg: { $cond: [{ $eq: ['$questions.isEvaluated', true] }, '$questions.technicalScore', 0] } },
                avgConfidence: { $avg: { $cond: [{ $eq: ['$questions.isEvaluated', true] }, '$questions.confidenceScore', 0] } },
                // totalQuestions: { $sum: 1 },
                // completedQuestions: { $sum: { $cond: [{ $eq: ['$questions.isEvaluated', true] }, 1, 0] } }
            },
        },
        {
            $project: {
                _id: 0,
                overallScore: { $round: [{ $avg: ['$avgTechnical', '$avgConfidence'] }, 0] },
                avgTechnical: { $round: ["$avgTechnical", 0] },
                avgConfidence: { $round: ["$avgConfidence", 0] },
                // totalQuestions: 1,
                // completedQuestions: { $sum: { $cond: [{ $eq: ['$questions.isEvaluated', true] }, 1, 0] } }
            }
        },
    ]);

    if (!result) {
        throw new Error("Session not found");
    }

    return result[0] || { overallScore: 0, avgTechnical: 0, avgConfidence: 0 };
};

const evaluateAnswerAsync = async (io, userId, sessionId, questionIdx, codeSubmission = null, audioFilePath = null) => {
    try {
        let transcription = "";
        const questionIndex = typeof questionIdx === "string" ? parseInt(questionIdx) : questionIdx;
        const session = await Session.findById(sessionId);

        if (!session) {
            throw new Error("Session not found");
        }

        const question = session.questions[questionIndex];

        if (!question) {
            throw new Error(`Question not found at index ${questionIndex}`);
        }

        if (audioFilePath) {
            try {
                pushSocketUpdate(io, userId, sessionId, "AI_TRANSCRIBING", `Transcribing question ${questionIndex + 1}...`);

                const formData = new FormData();
                formData.append("file", fs.createReadStream(audioFilePath));

                const response = await fetch(`${API_SERVICE_URL}/transcribe`, {
                    method: "POST",
                    body: formData,
                    headers: formData.getHeaders()
                });

                if (!response.ok) {
                    const error = await response.text();
                    throw new Error(`Failed to transcribe audio: ${error}`);
                }

                const data = await response.json();
                transcription = data.transcription || "";
            } catch (error) {
                console.error("Error in transcription:", error.message);
                // We'll continue with empty transcription if it fails
            }
            finally {
                if (audioFilePath && fs.existsSync(audioFilePath)) {
                    await fs.promises.unlink(audioFilePath);
                }
            }
        }

        try {
            pushSocketUpdate(io, userId, sessionId, "AI_EVALUATING", `Evaluating question ${questionIndex + 1}...`);

            const response = await fetch(`${API_SERVICE_URL}/evaluate`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    question: question.questionText,
                    question_type: question.questionType,
                    user_answer: transcription || "No verbal answer provided.",
                    user_code: codeSubmission || "",
                    role: session.role,
                    level: session.level,
                    interview_type: session.interviewType,
                }),
            });

            if (!response.ok) {
                let errorMsg = await response.text();
                try {
                    const parsed = JSON.parse(errorMsg);
                    errorMsg = parsed.detail || parsed.message || errorMsg;
                } catch {
                    // Use raw text if not JSON
                }
                throw new Error(errorMsg);
            }

            const data = await response.json();
            question.userAnswerText = transcription;
            question.userSubmittedCode = codeSubmission || "";
            question.idealAnswer = data.ideal_answer;
            question.technicalScore = data.technical_score;
            question.confidenceScore = data.confidence_score;
            question.aiFeedback = data.ai_feedback;
            question.isEvaluated = true;
            question.isSubmitted = true;

            const allQuestionsEvaluated = session.questions.every((q) => q.isEvaluated);

            if (session.status === "completed" || allQuestionsEvaluated) {
                const scoreSummary = await calculateScoreSummary(sessionId);
                session.overallScore = scoreSummary.overallScore;
                session.metrics.avgTechnical = scoreSummary.avgTechnical;
                session.metrics.avgConfidence = scoreSummary.avgConfidence;

                if (allQuestionsEvaluated) {
                    session.status = "completed";
                    session.endTime = session.endTime || Date.now();
                }
                await session.save();

                pushSocketUpdate(io, userId, sessionId, "session completed", `Question ${questionIndex + 1} evaluated successfully`);
            } else {
                session.status = "in-progress";
                await session.save();
                pushSocketUpdate(io, userId, sessionId, "evaluation completed", `Feedback for question ${questionIndex + 1} is ready`, session);
            }

        } catch (error) {
            console.error("Error in AI evaluation:", error.message);
            // Re-fetch session to ensure we have the latest state before update
            const sessionToUpdate = await Session.findById(sessionId);
            if (sessionToUpdate && sessionToUpdate.questions[questionIndex]) {
                sessionToUpdate.questions[questionIndex].isSubmitted = false;
                await sessionToUpdate.save();
            }
            pushSocketUpdate(io, userId, sessionId, "error", `Failed to evaluate answer: ${error.message}`, sessionToUpdate);
        }

    } catch (error) {
        console.error("Error in evaluateAnswerAsync:", error.message);
        pushSocketUpdate(io, userId, sessionId, "error", `Failed to evaluate answer: ${error.message}`);
    }
};

const submitAnswer = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { sessionId } = req.params;
    const { questionIndex, code } = req.body;

    const session = await Session.findOne({
        _id: sessionId,
        user: userId,
    });

    if (!session || session.user.toString() !== userId.toString()) {
        return res.status(404).json({ message: "Session not found" });
    }

    const questionIdx = parseInt(questionIndex);
    const question = session.questions[questionIdx];

    if (!question) {
        return res.status(404).json({ message: `Question not found at index ${questionIdx}` });
    }

    let audioFilePath = null;
    if (req.file) {
        audioFilePath = path.join(process.cwd(), req.file.path);
    }

    const codeSubmission = code || null;

    question.isSubmitted = true;
    await session.save();

    res.status(200).json({
        status: "received",
        message: "Answer submitted successfully",
    });

    const io = req.app.get("io");
    evaluateAnswerAsync(io, userId, sessionId, questionIdx, codeSubmission, audioFilePath);
});

const endSession = asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    const userId = req.user.id;

    if (!sessionId) {
        return res.status(400).json({ message: "Session ID is required" });
    }

    const session = await Session.findById(sessionId);

    if (!session || session.user.toString() !== userId.toString()) {
        return res.status(404).json({ message: "Session not found" });
    }

    const isProcessing = session.questions.some((q) => !q.isEvaluated && q.isSubmitted);

    if (isProcessing) {
        return res.status(400).json({ message: "Session is still processing. Please wait..." });
    }

    if (session.status === "completed") {
        return res.status(400).json({ message: "Session is already completed" });
    }

    const scoreSummary = await calculateScoreSummary(sessionId);
    session.overallScore = scoreSummary.overallScore || 0;
    session.metrics.avgTechnical = scoreSummary.avgTechnical || 0;
    session.metrics.avgConfidence = scoreSummary.avgConfidence || 0;

    session.status = "completed";
    session.endTime = session.endTime || Date.now();
    await session.save();
    const io = req.app.get("io");
    pushSocketUpdate(io, userId, sessionId, "session completed", `Session completed successfully`, session);

    res.status(200).json({
        message: "Session ended successfully",
        session
    });
});

export { createSession, getSession, getSessionById, deleteSession, submitAnswer, endSession };