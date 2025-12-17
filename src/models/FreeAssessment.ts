import mongoose, { Schema, Document } from "mongoose";

export interface IEvaluation {
    listeningScore: {
        auto: number;
        manual: number | null;
        totalQuestions: number;
        correctAnswers: number;
    };
    readingScore: {
        auto: number;
        manual: number | null;
        totalQuestions: number;
        correctAnswers: number;
    };
    writingScore: {
        task1: number | null;
        task2: number | null;
        overall: number | null;
    };
    overallBand: number | null;
    evaluatedBy: mongoose.Types.ObjectId | null;
    evaluatedAt: Date | null;
    notes: string;
    answerDetails: {
        listening: Record<string, { userAnswer: string; correctAnswer: string; isCorrect: boolean; overridden?: boolean }>;
        reading: Record<string, { userAnswer: string; correctAnswer: string; isCorrect: boolean; overridden?: boolean }>;
    };
}

export interface IFreeAssessment extends Document {
    personalInfo: {
        fullName: string;
        email: string;
        phone: string;
        country: string;
        age: string;
        preferredLanguage: string;
        purpose: string;
    };
    progress: {
        currentStep: number;
        completedSections: string[];
        startedAt: Date;
        lastUpdatedAt: Date;
    };
    listeningAnswers: Record<string, string>;
    readingAnswers: Record<string, string>;
    writingAnswers: Record<string, string>;
    booking: {
        date: Date;
        time: string;
        type: string;
    } | null;
    status: "in-progress" | "completed" | "abandoned";
    evaluation?: IEvaluation;
}

const evaluationSchema = new Schema({
    listeningScore: {
        auto: { type: Number, default: 0 },
        manual: { type: Number, default: null },
        totalQuestions: { type: Number, default: 0 },
        correctAnswers: { type: Number, default: 0 },
    },
    readingScore: {
        auto: { type: Number, default: 0 },
        manual: { type: Number, default: null },
        totalQuestions: { type: Number, default: 0 },
        correctAnswers: { type: Number, default: 0 },
    },
    writingScore: {
        task1: { type: Number, default: null },
        task2: { type: Number, default: null },
        overall: { type: Number, default: null },
    },
    overallBand: { type: Number, default: null },
    evaluatedBy: { type: Schema.Types.ObjectId, ref: "Admin", default: null },
    evaluatedAt: { type: Date, default: null },
    notes: { type: String, default: "" },
    answerDetails: {
        listening: { type: Schema.Types.Mixed, default: {} },
        reading: { type: Schema.Types.Mixed, default: {} },
    },
}, { _id: false });

const freeAssessmentSchema = new Schema<IFreeAssessment>(
    {
        personalInfo: {
            fullName: { type: String, required: true },
            email: { type: String, required: true },
            phone: { type: String, required: true },
            country: { type: String, required: true },
            age: { type: String, required: true },
            preferredLanguage: { type: String, required: true },
            purpose: { type: String, required: true },
        },
        progress: {
            currentStep: { type: Number, default: 1 },
            completedSections: [{ type: String }],
            startedAt: { type: Date, default: Date.now },
            lastUpdatedAt: { type: Date, default: Date.now },
        },
        listeningAnswers: { type: Schema.Types.Mixed, default: {} },
        readingAnswers: { type: Schema.Types.Mixed, default: {} },
        writingAnswers: { type: Schema.Types.Mixed, default: {} },
        booking: { type: Schema.Types.Mixed, default: null },
        status: {
            type: String,
            enum: ["in-progress", "completed", "abandoned"],
            default: "in-progress",
        },
        evaluation: { type: evaluationSchema, default: null },
    },
    { timestamps: true }
);

// Index for faster queries
freeAssessmentSchema.index({ "personalInfo.email": 1 });
freeAssessmentSchema.index({ status: 1 });
freeAssessmentSchema.index({ createdAt: -1 });

export default mongoose.model<IFreeAssessment>("FreeAssessment", freeAssessmentSchema);

