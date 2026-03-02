import asyncHandler from "express-async-handler";
import Session from "../models/SessionModel.js";
import fetch from "node-fetch";
import fs from "fs";
import FormData from "form-data";
import path from "path";
import mongoose from "mongoose";

const API_SERVICE_URL = "http://localhost:8000";

const pushSocketUpdate = (io, userId, sessionId, status, message, sessionData = null) => {
    io.to(userId.toString()).emit("sessionUpdate", {
        sessionId,
        status,
        message,
        sessionData
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
            pushSocketUpdate(io, userId, session._id, "processing...", `Generating ${count} questions for ${role} role ${level} level interview ...`);

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

            const questions = aiData.questions.map((qText, index) => ({
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

            pushSocketUpdate(io, userId, session._id, "Questions ready...", "Starting Interview...");
        } catch (error) {
            console.error("Error in createSession:", error.message);
            session.status = "failed";
            await session.save();
            pushSocketUpdate(io, userId, session._id, "error", "Failed to generate questions", {
                error: error.message,
            });
        }
    })();
});

export { createSession };