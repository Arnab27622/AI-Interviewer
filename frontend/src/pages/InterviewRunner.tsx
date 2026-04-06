import { useState } from "react";
import { useAudioRecorder } from "../hooks/useAudioRecorder";
import { useInterviewSession } from "../hooks/useInterviewSession";
import ConfirmModal from "../components/ConfirmModal";
import InterviewHeader from "../components/InterviewHeader";
import QuestionSection from "../components/QuestionSection";
import VerbalRecorder from "../components/VerbalRecorder";
import CodeEditorSection from "../components/CodeEditorSection";
import AIFeedbackSection from "../components/AIFeedbackSection";
import InterviewLoading from "../components/InterviewLoading";

const InterviewRunner = () => {
    const [isFinishModalOpen, setIsFinishModalOpen] = useState(false);
    
    const { 
        isRecording, 
        recordingTime, 
        startRecording, 
        stopRecording,
        setRecordingTime
    } = useAudioRecorder();

    const {
        activeSession,
        isLoading,
        sessionMessage,
        currentQuestionIndex,
        currentQuestion,
        selectedLanguage,
        setSelectedLanguage,
        drafts,
        isQuestionLocked,
        isProcessing,
        submittedLocal,
        handleNavigation,
        updateDraftCode,
        updateDraftAudio,
        deleteDraftAudio,
        handleSubmitAnswer,
        confirmFinishInterview
    } = useInterviewSession(stopRecording, setRecordingTime);

    if (!activeSession || !activeSession.questions || activeSession.questions.length === 0) {
        return <InterviewLoading sessionMessage={sessionMessage} />;
    }

    const currentDraft = drafts[currentQuestionIndex] || {};

    return (
        <div className="max-w-7xl mx-auto px-4 pb-32">
            <InterviewHeader 
                role={activeSession.role}
                questions={activeSession.questions}
                currentQuestionIndex={currentQuestionIndex}
                submittedLocal={submittedLocal}
                handleNavigation={handleNavigation}
                handleFinishInterview={() => setIsFinishModalOpen(true)}
                isLoading={isLoading}
                questionsCount={activeSession.questions.length}
            />

            <QuestionSection 
                index={currentQuestionIndex}
                text={currentQuestion?.questionText || ""}
            />

            <div className={`grid gap-6 ${currentQuestion?.questionType === 'coding' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
                <VerbalRecorder 
                    isRecording={isRecording}
                    recordingTime={recordingTime}
                    hasAudio={!!currentDraft.audio}
                    isQuestionLocked={isQuestionLocked}
                    startRecording={() => startRecording(updateDraftAudio)}
                    stopRecording={stopRecording}
                    deleteDraftAudio={deleteDraftAudio}
                />

                {currentQuestion?.questionType === 'coding' && (
                    <CodeEditorSection 
                        language={selectedLanguage}
                        code={currentDraft.code || ""}
                        isQuestionLocked={isQuestionLocked}
                        setLanguage={setSelectedLanguage}
                        updateCode={updateDraftCode}
                    />
                )}
            </div>

            <AIFeedbackSection 
                isEvaluated={!!currentQuestion?.isEvaluated}
                feedback={currentQuestion?.aiFeedback || ""}
                score={currentQuestion?.technicalScore || 0}
            />

            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 px-6 md:px-12 flex justify-between items-center z-50">
                <button 
                    onClick={() => handleNavigation(currentQuestionIndex - 1)} 
                    disabled={currentQuestionIndex === 0} 
                    className="text-slate-500 font-bold text-sm hover:text-slate-800 disabled:opacity-30 cursor-pointer"
                >
                    ← Previous
                </button>

                <div className="flex flex-col items-center">
                    {isProcessing && sessionMessage && (
                        <div className="mb-2 text-xs font-mono text-blue-600 bg-blue-50 px-3 py-1 rounded-full animate-pulse border border-blue-100">
                            {sessionMessage}...
                        </div>
                    )}

                    <button 
                        onClick={handleSubmitAnswer} 
                        disabled={isQuestionLocked} 
                        className={`px-8 py-3 rounded-xl font-bold text-white shadow-lg transition-all ${isProcessing ? 'bg-slate-400 cursor-wait' : currentQuestion?.isEvaluated ? 'bg-emerald-500' : isQuestionLocked ? 'bg-slate-400' : 'bg-slate-900 hover:bg-slate-800 active:scale-95 cursor-pointer'}`}
                    >
                        {isProcessing ? 'Analyzing...' : currentQuestion?.isEvaluated ? 'Answer Submitted' : isQuestionLocked ? 'Submitted' : 'Submit Answer'}
                    </button>
                </div>

                <button 
                    onClick={() => handleNavigation(currentQuestionIndex + 1)} 
                    disabled={currentQuestionIndex === (activeSession?.questions?.length || 0) - 1} 
                    className="text-slate-500 font-bold hover:text-slate-800 disabled:opacity-30 cursor-pointer"
                >
                    Next →
                </button>
            </div>

            <ConfirmModal
                isOpen={isFinishModalOpen}
                title="Finish Interview?"
                message="Are you sure you want to end this interview session? You won't be able to change your answers after this."
                confirmText="Finish"
                cancelText="Keep Going"
                onConfirm={confirmFinishInterview}
                onCancel={() => setIsFinishModalOpen(false)}
                isDanger={false}
            />
        </div>
    );
};

export default InterviewRunner;