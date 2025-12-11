import mongoose, { Schema, Document } from "mongoose";

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
}

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
    },
    { timestamps: true }
);

// Index for faster queries
freeAssessmentSchema.index({ "personalInfo.email": 1 });
freeAssessmentSchema.index({ status: 1 });
freeAssessmentSchema.index({ createdAt: -1 });

export default mongoose.model<IFreeAssessment>("FreeAssessment", freeAssessmentSchema);
