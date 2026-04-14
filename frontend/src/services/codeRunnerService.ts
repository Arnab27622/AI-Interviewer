// Code execution service - proxied through our backend to JDoodle API
const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000/api") + "/code/execute";

// Languages that cannot be executed (markup/config languages)
const NON_EXECUTABLE = new Set([
    "sql", "html", "css", "yaml", "markdown", "plaintext", "solidity", "powershell", "objective-c"
]);

// Languages supported by JDoodle via our backend
const EXECUTABLE_LANGUAGES = new Set([
    "javascript", "typescript", "python", "java", "cpp", "c", "csharp",
    "go", "rust", "php", "ruby", "swift", "kotlin", "scala",
    "perl", "lua", "dart", "bash", "shell", "r",
    "elixir", "haskell", "clojure", "fsharp"
]);

export interface ExecutionResult {
    stdout: string;
    stderr: string;
    exitCode: number;
    signal: string | null;
    timedOut: boolean;
    cpuTime?: string;
    memory?: string;
}

export const isExecutable = (language: string): boolean => {
    return !NON_EXECUTABLE.has(language) && EXECUTABLE_LANGUAGES.has(language);
};

export const executeCode = async (
    language: string,
    code: string,
    stdin: string = ""
): Promise<ExecutionResult> => {
    if (!isExecutable(language)) {
        return {
            stdout: "",
            stderr: `Language "${language}" is not supported for execution.`,
            exitCode: 1,
            signal: null,
            timedOut: false,
        };
    }

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ language, code, stdin }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Server returned ${response.status}`);
        }

        const data = await response.json();
        const run = data.run;

        return {
            stdout: run?.stdout || "",
            stderr: run?.stderr || "",
            exitCode: run?.code ?? 1,
            signal: run?.signal || null,
            timedOut: run?.signal === "SIGKILL",
            cpuTime: run?.cpuTime,
            memory: run?.memory,
        };
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return {
            stdout: "",
            stderr: `Execution failed: ${message}`,
            exitCode: 1,
            signal: null,
            timedOut: false,
        };
    }
};
