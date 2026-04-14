import express from "express";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// Require authentication for all code execution routes
router.use(protect);

const JDOODLE_API = "https://api.jdoodle.com/v1/execute";

// Map Monaco language IDs to JDoodle language codes + version indices
const LANGUAGE_MAP = {
    javascript: { language: "nodejs", versionIndex: "4" },
    typescript: { language: "typescript", versionIndex: "0" },
    python:     { language: "python3", versionIndex: "4" },
    java:       { language: "java", versionIndex: "4" },
    cpp:        { language: "cpp17", versionIndex: "1" },
    c:          { language: "c", versionIndex: "5" },
    csharp:     { language: "csharp", versionIndex: "4" },
    go:         { language: "go", versionIndex: "4" },
    rust:       { language: "rust", versionIndex: "4" },
    php:        { language: "php", versionIndex: "4" },
    ruby:       { language: "ruby", versionIndex: "4" },
    swift:      { language: "swift", versionIndex: "4" },
    kotlin:     { language: "kotlin", versionIndex: "4" },
    scala:      { language: "scala", versionIndex: "4" },
    perl:       { language: "perl", versionIndex: "4" },
    lua:        { language: "lua", versionIndex: "3" },
    dart:       { language: "dart", versionIndex: "4" },
    bash:       { language: "bash", versionIndex: "4" },
    shell:      { language: "bash", versionIndex: "4" },
    r:          { language: "r", versionIndex: "4" },
    elixir:     { language: "elixir", versionIndex: "4" },
    haskell:    { language: "haskell", versionIndex: "4" },
    clojure:    { language: "clojure", versionIndex: "4" },
    fsharp:     { language: "fsharp", versionIndex: "1" },
};

/**
 * POST /api/code/execute
 * Proxies code execution to JDoodle API.
 * Requires JDOODLE_CLIENT_ID and JDOODLE_CLIENT_SECRET in .env
 */
router.post("/execute", async (req, res) => {
    const { language, code, stdin } = req.body;

    if (!language || !code) {
        return res.status(400).json({ error: "Language and code are required." });
    }

    const clientId = process.env.JDOODLE_CLIENT_ID;
    const clientSecret = process.env.JDOODLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        return res.status(500).json({ 
            error: "Code execution is not configured. Add JDOODLE_CLIENT_ID and JDOODLE_CLIENT_SECRET to your .env file." 
        });
    }

    const runtime = LANGUAGE_MAP[language];
    if (!runtime) {
        return res.status(400).json({ error: `Language "${language}" is not supported for execution.` });
    }

    try {
        const response = await fetch(JDOODLE_API, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                clientId,
                clientSecret,
                script: code,
                stdin: stdin || "",
                language: runtime.language,
                versionIndex: runtime.versionIndex,
            }),
        });

        if (!response.ok) {
            const text = await response.text();
            return res.status(response.status).json({ 
                error: `JDoodle API error: ${response.status}`, 
                details: text 
            });
        }

        const data = await response.json();

        // JDoodle returns { output, statusCode, memory, cpuTime }
        // Normalize to a consistent format for the frontend
        res.json({
            run: {
                stdout: data.output || "",
                stderr: data.statusCode === 200 ? "" : (data.output || "Execution error"),
                code: data.statusCode === 200 ? 0 : 1,
                signal: null,
                cpuTime: data.cpuTime,
                memory: data.memory,
            }
        });
    } catch (error) {
        console.error("Code execution proxy error:", error.message);
        res.status(500).json({ error: "Code execution service unavailable." });
    }
});

/**
 * GET /api/code/credits
 * Check remaining JDoodle API credits for the day
 */
router.get("/credits", async (req, res) => {
    const clientId = process.env.JDOODLE_CLIENT_ID;
    const clientSecret = process.env.JDOODLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        return res.status(500).json({ error: "JDoodle credentials not configured." });
    }

    try {
        const response = await fetch("https://api.jdoodle.com/v1/credit-spent", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ clientId, clientSecret }),
        });
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: "Could not check credits." });
    }
});

export default router;
