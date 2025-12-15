import mongoose, { Schema, Document } from "mongoose";

// Question interface
interface IQuestion {
    questionNumber: number;
    type: "mcq" | "fill-blank" | "matching" | "short-answer" | "multiple-selection" |
    "map-labeling" | "instruction" | "true-false-ng" | "matching-sections" | "summary-completion";
    questionText: string;
    instruction?: string;
    options?: string[];        // For MCQ, multiple-selection, true-false-ng
    correctAnswer: string;     // Single answer or comma-separated for multiple
    autoMark?: boolean;        // Whether to auto-grade this question
    matchingPairs?: { left: string; right: string }[];  // For matching type
    sectionOptions?: string[]; // For matching-sections (A, B, C, D, etc.)
    summaryText?: string;      // For summary-completion type
    selectCount?: number;      // For multiple-selection (e.g., "Choose TWO")
}

// Listening Part interface (audio now at section level, not per-part)
interface IListeningPart {
    partNumber: number;
    audioUrl?: string;       // Deprecated - now at section level
    audioTitle?: string;     // Deprecated - now at section level
    audioDescription?: string;
    questions: IQuestion[];
}

// Reading Passage interface
interface IReadingPassage {
    passageNumber: number;
    title: string;
    content: string;
    sectionLabels?: string[];  // For passages with labeled sections ("A", "B", "C"...)
    questions: IQuestion[];
}

// Writing Task interface
interface IWritingTask {
    taskNumber: number;
    taskType: "task1" | "task2";
    title: string;              // e.g., "Academic Writing Task 1"
    prompt: string;             // The question/prompt text
    description?: string;       // Additional instructions
    imageUrl?: string;          // For graph/chart descriptions (Cloudinary URL)
    minWords: number;           // e.g., 150 for Task 1, 250 for Task 2
    timeAllocation: number;     // Time in minutes (e.g., 20 for Task 1, 40 for Task 2)
}

export interface IFreeAssessmentContent extends Document {
    sectionType: "listening" | "reading" | "writing";
    examType: "general" | "academic";  // General Education uses "general" content
    isActive: boolean;
    createdBy?: mongoose.Types.ObjectId;

    // Listening section-level audio (single 30-min clip)
    listeningAudioUrl?: string;
    listeningAudioTitle?: string;
    listeningAudioDescription?: string;

    // Listening parts (questions only, audio is at section level)
    listeningParts?: IListeningPart[];

    // Reading specific (future)
    readingPassages?: IReadingPassage[];

    // Writing specific (future)
    writingTasks?: IWritingTask[];

    // Metadata
    totalQuestions: number;
    lastUpdatedAt: Date;
}

const questionSchema = new Schema({
    questionNumber: { type: Number, required: true },
    type: {
        type: String,
        enum: ["mcq", "fill-blank", "matching", "short-answer", "multiple-selection",
            "map-labeling", "instruction", "true-false-ng", "matching-sections", "summary-completion"],
        required: true
    },
    questionText: { type: String, required: true },
    instruction: { type: String },
    options: [{ type: String }],
    correctAnswer: { type: String, default: "" },
    autoMark: { type: Boolean, default: true },
    matchingPairs: [{
        left: { type: String },
        right: { type: String }
    }],
    sectionOptions: [{ type: String }],  // For matching-sections
    summaryText: { type: String },        // For summary-completion
    selectCount: { type: Number, default: 1 }  // For multiple-selection
}, { _id: false });

const listeningPartSchema = new Schema({
    partNumber: { type: Number, required: true, min: 1, max: 4 },
    audioUrl: { type: String },      // Deprecated - kept for migration
    audioTitle: { type: String },    // Deprecated - kept for migration
    audioDescription: { type: String },
    questions: [questionSchema]
}, { _id: false });

const readingPassageSchema = new Schema({
    passageNumber: { type: Number, required: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    imageUrl: { type: String },  // For passage images (maps, diagrams, charts)
    sectionLabels: [{ type: String }],  // For passages with labeled sections
    questions: [questionSchema]
}, { _id: false });

const writingTaskSchema = new Schema({
    taskNumber: { type: Number, required: true },
    taskType: { type: String, enum: ["task1", "task2"], required: true },
    title: { type: String, required: true },
    prompt: { type: String, required: true },
    description: { type: String },
    imageUrl: { type: String },
    minWords: { type: Number, default: 150 },
    timeAllocation: { type: Number, required: true }  // Time in minutes
}, { _id: false });

const freeAssessmentContentSchema = new Schema<IFreeAssessmentContent>(
    {
        sectionType: {
            type: String,
            enum: ["listening", "reading", "writing"],
            required: true
        },
        examType: {
            type: String,
            enum: ["general", "academic"],
            required: true,
            default: "general"
        },
        isActive: { type: Boolean, default: false },
        createdBy: { type: Schema.Types.ObjectId, ref: "Admin" },

        // Single 30-minute audio for listening section
        listeningAudioUrl: { type: String },
        listeningAudioTitle: { type: String },
        listeningAudioDescription: { type: String },

        listeningParts: [listeningPartSchema],
        readingPassages: [readingPassageSchema],
        writingTasks: [writingTaskSchema],

        totalQuestions: { type: Number, default: 0 },
        lastUpdatedAt: { type: Date, default: Date.now }
    },
    { timestamps: true }
);

// Compound unique index: one document per sectionType + examType combination
freeAssessmentContentSchema.index({ sectionType: 1, examType: 1 }, { unique: true });
freeAssessmentContentSchema.index({ isActive: 1 });

// Pre-save to calculate total questions (excluding instruction types)
freeAssessmentContentSchema.pre("save", function (next) {
    let total = 0;

    if (this.listeningParts) {
        this.listeningParts.forEach(part => {
            // Count only actual questions, not instructions
            total += part.questions?.filter(q => q.type !== "instruction").length || 0;
        });
    }

    if (this.readingPassages) {
        this.readingPassages.forEach(passage => {
            total += passage.questions?.filter(q => q.type !== "instruction").length || 0;
        });
    }

    if (this.writingTasks) {
        total += this.writingTasks.length;
    }

    this.totalQuestions = total;
    this.lastUpdatedAt = new Date();
    next();
});

export default mongoose.model<IFreeAssessmentContent>("FreeAssessmentContent", freeAssessmentContentSchema);
