import React from "react";
import MicIcon from "./MicIcon";

interface VerbalRecorderProps {
    isRecording: boolean;
    recordingTime: number;
    hasAudio: boolean;
    isQuestionLocked: boolean;
    startRecording: () => void;
    stopRecording: () => void;
    deleteDraftAudio: () => void;
}

const VerbalRecorder: React.FC<VerbalRecorderProps> = ({
    isRecording,
    recordingTime,
    hasAudio,
    isQuestionLocked,
    startRecording,
    stopRecording,
    deleteDraftAudio
}) => {
    return (
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center justify-center min-h-100">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Verbal Answer</h3>
            {!isRecording && !hasAudio ? (
                <button
                    onClick={startRecording}
                    disabled={isQuestionLocked}
                    className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-xl hover:scale-105 transition-all disabled:opacity-50 cursor-pointer"
                >
                    <MicIcon />
                </button>
            ) : isRecording ? (
                <div className="flex flex-col items-center gap-4">
                    <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center text-white animate-pulse">
                        <div className="w-4 h-4 bg-white rounded-sm"></div>
                    </div>
                    <span className="text-red-500 font-mono font-bold">
                        {Math.floor(recordingTime / 60)}:{String(recordingTime % 60).padStart(2, '0')}
                    </span>
                    <button onClick={stopRecording} className="text-slate-500 underline text-sm cursor-pointer">Stop Recording</button>
                </div>
            ) : (
                <div className="text-center">
                    <div className="text-emerald-500 font-bold text-lg mb-2">Audio Captured 🟩</div>
                    {!isQuestionLocked && (
                        <button
                            onClick={deleteDraftAudio}
                            className="text-xs text-slate-400 underline hover:text-rose-500 cursor-pointer"
                        >
                            Delete & Re-record
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default VerbalRecorder;
