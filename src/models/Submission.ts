import mongoose, { Schema, Document } from "mongoose";

export interface ISubmission extends Document {
  userId: mongoose.Types.ObjectId;
  assessmentType: string;
  answers: any;
  score?: number;
  status: "pending" | "graded" | "reviewed";
  submittedAt: Date;
  gradedAt?: Date;
}

const submissionSchema = new Schema<ISubmission>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    assessmentType: { type: String, required: true },
    answers: { type: Schema.Types.Mixed, required: true },
    score: { type: Number },
    status: { type: String, enum: ["pending", "graded", "reviewed"], default: "pending" },
    submittedAt: { type: Date, default: Date.now },
    gradedAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model<ISubmission>("Submission", submissionSchema);
