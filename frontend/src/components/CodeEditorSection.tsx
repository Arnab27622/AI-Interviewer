import React from "react";
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
    return (
        <div className="bg-white p-2 rounded-3xl border border-slate-100 shadow-sm overflow-hidden h-100">
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
            <MonacoEditor
                height="100%"
                language={language}
                theme="vs-dark"
                value={code}
                onChange={updateCode}
                options={{
                    minimap: { enabled: false },
                    fontSize: 13,
                    scrollBeyondLastLine: false,
                    readOnly: isQuestionLocked,
                    domReadOnly: isQuestionLocked,
                }}
            />
        </div>
    );
};

export default CodeEditorSection;
