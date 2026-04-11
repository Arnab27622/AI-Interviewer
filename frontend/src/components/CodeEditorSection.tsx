import React, { useState, useEffect, useRef } from "react";
import MonacoEditor from "@monaco-editor/react";
import { SUPPORTED_LANGUAGES } from "../constants/interview";

interface CodeEditorSectionProps {
    language: string;
    code: string;
    isQuestionLocked: boolean;
    setLanguage: (lang: string) => void;
    updateCode: (code: string | undefined) => void;
}

const CodeEditorSection: React.FC<CodeEditorSectionProps> = ({
    language,
    code,
    isQuestionLocked,
    setLanguage,
    updateCode
}) => {
    // Local state for immediate feedback
    const [localCode, setLocalCode] = useState(code);
    const debounceTimerRef = useRef<number | null>(null);

    // Update local state when the prop changes (e.g. navigation between questions)
    useEffect(() => {
        setLocalCode(code);
    }, [code]);

    const handleCodeChange = (newVal: string | undefined) => {
        if (isQuestionLocked) return;
        
        // 1. Update local state immediately for zero-latency typing
        setLocalCode(newVal ?? "");

        // 2. Clear existing timer
        if (debounceTimerRef.current !== null) {
            window.clearTimeout(debounceTimerRef.current);
        }

        // 3. Set a new timer to update parent state (and localStorage) after 500ms
        debounceTimerRef.current = window.setTimeout(() => {
            updateCode(newVal);
        }, 500);
    };

    // Cleanup timer on unmount
    useEffect(() => {
        return () => {
            if (debounceTimerRef.current !== null) {
                window.clearTimeout(debounceTimerRef.current);
            }
        };
    }, []);

    return (
        <div className="bg-white p-2 rounded-3xl border border-slate-100 shadow-sm overflow-hidden h-100 flex flex-col">
            <div className="flex justify-between px-4 py-2 bg-slate-50 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-500 uppercase py-2">Code Editor</span>
                <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    disabled={isQuestionLocked}
                    className="text-xs bg-white border border-slate-200 rounded-lg px-2 disabled:bg-slate-100 disabled:text-slate-400"
                >
                    {SUPPORTED_LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                </select>
            </div>
            <div className="flex-1">
                <MonacoEditor
                    height="100%"
                    language={language}
                    theme="vs-dark"
                    value={localCode}
                    onChange={handleCodeChange}
                    options={{
                        minimap: { enabled: false },
                        fontSize: 13,
                        scrollBeyondLastLine: false,
                        readOnly: isQuestionLocked,
                        domReadOnly: isQuestionLocked,
                        automaticLayout: true,
                    }}
                />
            </div>
        </div>
    );
};

export default CodeEditorSection;
