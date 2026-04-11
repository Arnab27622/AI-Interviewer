import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
    questionText: {
        type: String,
        required: true,
    },
    questionType: {
        type: String,
        enum: ["oral", "coding"],
        required: true,
    },
    idealAnswer: {
        type: String,
        required: true,
        default: "Pending"
    },
    userAnswerText: {
        type: String,
        default: ""
    },
    userSubmittedCode: {
        type: String,
        default: ""
    },
    isSubmitted: {
        type: Boolean,
        default: false
    },
    isEvaluated: {
        type: Boolean,
        default: false
    },
    technicalScore: {
        type: Number,
        default: 0,
    },
    confidenceScore: {
        type: Number,
        default: 0,
    },
    aiFeedback: {
        type: String,
        default: "",
    }
}, { timestamps: true });

const sessionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    role: {
        type: String,
        required: true,
    },
    level: {
        type: String,
        required: true,
    },
    interviewType: {
        type: String,
        enum: ["oral-only", "coding-mix"],
        required: true,
    },
    status: {
        type: String,
        enum: ["pending", "in-progress", "completed", "cancelled", "failed"],
        default: "pending",
    },
    overallScore: {
        type: Number,
        default: 0,
    },
    metrics: {
        avgTechnical: {
            type: Number,
            default: 0
        },
        avgConfidence: {
            type: Number,
            default: 0
        }
    },
    questions: [questionSchema],
    startTime: {
        type: Date,
        default: Date.now
    },
    endTime: {
        type: Date,
        default: null
    }
}, { timestamps: true });

sessionSchema.statics.calculateScoreSummary = async function(sessionId) {
    const result = await this.aggregate([
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
                avgTechnical: { $avg: { $cond: [{ $eq: ['$questions.isEvaluated', true] }, '$questions.technicalScore', null] } },
                avgConfidence: { $avg: { $cond: [{ $eq: ['$questions.isEvaluated', true] }, '$questions.confidenceScore', null] } },
            },
        },
        {
            $project: {
                _id: 0,
                overallScore: { $round: [{ $avg: ['$avgTechnical', '$avgConfidence'] }, 0] },
                avgTechnical: { $round: ["$avgTechnical", 0] },
                avgConfidence: { $round: ["$avgConfidence", 0] },
            }
        },
    ]);

    return result[0] || { overallScore: 0, avgTechnical: 0, avgConfidence: 0 };
};

const Session = mongoose.model("Session", sessionSchema);

export default Session;