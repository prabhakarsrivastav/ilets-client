import mongoose, { Schema, Document } from "mongoose";

// Question interface
interface IQuestion {
    questionNumber: number;
    type: "mcq" | "fill-blank" | "matching" | "short-answer" | "multiple-selection" | "map-labeling" | "instruction";
    questionText: string;
    instruction?: string;
    options?: string[];        // For MCQ, multiple-selection
    correctAnswer: string;     // Single answer or comma-separated for multiple
    autoMark?: boolean;        // Whether to auto-grade this question
    matchingPairs?: { left: string; right: string }[];  // For matching type
}

// Listening Part interface
interface IListeningPart {
    partNumber: number;
    audioUrl: string;
    audioTitle: string;
    audioDescription?: string;
    questions: IQuestion[];
}

// Reading Passage interface (for future)
interface IReadingPassage {
    passageNumber: number;
    title: string;
    content: string;
    questions: IQuestion[];
}

// Writing Task interface (for future)
interface IWritingTask {
    taskNumber: number;
    taskType: "task1" | "task2";
    prompt: string;
    imageUrl?: string;  // For graph/chart descriptions
    minWords: number;
    maxWords: number;
}

export interface IFreeAssessmentContent extends Document {
    sectionType: "listening" | "reading" | "writing";
    isActive: boolean;
    createdBy?: mongoose.Types.ObjectId;

    // Listening specific
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
        enum: ["mcq", "fill-blank", "matching", "short-answer", "multiple-selection", "map-labeling", "instruction"],
        required: true
    },
    questionText: { type: String, required: true },
    instruction: { type: String },
    options: [{ type: String }],
    correctAnswer: { type: String, default: "" },  // Optional - empty for instructions or auto-mark off
    autoMark: { type: Boolean, default: true },  // Whether to auto-grade this question
    matchingPairs: [{
        left: { type: String },
        right: { type: String }
    }]
}, { _id: false });

const listeningPartSchema = new Schema({
    partNumber: { type: Number, required: true, min: 1, max: 4 },
    audioUrl: { type: String, default: "" },  // Optional for draft state
    audioTitle: { type: String, default: "" },  // Optional for draft state
    audioDescription: { type: String },
    questions: [questionSchema]
}, { _id: false });

const readingPassageSchema = new Schema({
    passageNumber: { type: Number, required: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    questions: [questionSchema]
}, { _id: false });

const writingTaskSchema = new Schema({
    taskNumber: { type: Number, required: true },
    taskType: { type: String, enum: ["task1", "task2"], required: true },
    prompt: { type: String, required: true },
    imageUrl: { type: String },
    minWords: { type: Number, default: 150 },
    maxWords: { type: Number, default: 250 }
}, { _id: false });

const freeAssessmentContentSchema = new Schema<IFreeAssessmentContent>(
    {
        sectionType: {
            type: String,
            enum: ["listening", "reading", "writing"],
            required: true,
            unique: true
        },
        isActive: { type: Boolean, default: false },
        createdBy: { type: Schema.Types.ObjectId, ref: "Admin" },

        listeningParts: [listeningPartSchema],
        readingPassages: [readingPassageSchema],
        writingTasks: [writingTaskSchema],

        totalQuestions: { type: Number, default: 0 },
        lastUpdatedAt: { type: Date, default: Date.now }
    },
    { timestamps: true }
);

// Index
freeAssessmentContentSchema.index({ sectionType: 1 });
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
