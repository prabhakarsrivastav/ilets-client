import mongoose, { Document, Schema } from 'mongoose';

// Interfaces
export interface IQuestion {
  number: number;
  promptText: string;
  gapSuffix?: string;
  correctAnswer: string;
  options?: string[];
}

export interface IQuestionSet {
  instruction: string;
  type: 'FORM' | 'MCQ' | 'MATCHING' | 'FLOW_CHART' | 'NOTE_COMPLETION';
  optionsPool?: string[];
  questions: IQuestion[];
}

export interface ISection {
  sectionNumber: 1 | 2 | 3 | 4;
  reviewStartTime: number;
  questionSets: IQuestionSet[];
}

export interface IAssessment extends Document {
  title: string;
  audioUrl: string;
  totalQuestions: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  sections: ISection[];
  isPublished: boolean;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Question Schema (embedded in QuestionSet)
const QuestionSchema = new Schema<IQuestion>({
  number: {
    type: Number,
    required: true,
    min: 1,
    max: 40
  },
  promptText: {
    type: String,
    required: true,
    trim: true
  },
  gapSuffix: {
    type: String,
    trim: true,
    default: ''
  },
  correctAnswer: {
    type: String,
    required: true,
    trim: true
  },
  options: [{
    type: String,
    trim: true
  }]
}, { _id: false });

// QuestionSet Schema (embedded in Section)
const QuestionSetSchema = new Schema<IQuestionSet>({
  instruction: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: ['FORM', 'MCQ', 'MATCHING', 'FLOW_CHART', 'NOTE_COMPLETION']
  },
  optionsPool: [{
    type: String,
    trim: true
  }],
  questions: [QuestionSchema]
}, { _id: false });

// Section Schema (embedded in Assessment)
const SectionSchema = new Schema<ISection>({
  sectionNumber: {
    type: Number,
    required: true,
    min: 1,
    max: 4
  },
  reviewStartTime: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  questionSets: [QuestionSetSchema]
}, { _id: false });

// Main Assessment Schema
const AssessmentSchema = new Schema<IAssessment>({
  title: {
    type: String,
    required: [true, 'Assessment title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  audioUrl: {
    type: String,
    required: [true, 'Audio URL is required'],
    trim: true
  },
  totalQuestions: {
    type: Number,
    required: true,
    min: 1,
    max: 40,
    default: 40
  },
  difficulty: {
    type: String,
    required: true,
    enum: {
      values: ['Easy', 'Medium', 'Hard'],
      message: 'Difficulty must be Easy, Medium, or Hard'
    },
    default: 'Medium'
  },
  sections: {
    type: [SectionSchema],
    validate: {
      validator: function(sections: ISection[]) {
        if (sections.length !== 4) return false;
        const sectionNumbers = sections.map(s => s.sectionNumber).sort();
        return JSON.stringify(sectionNumbers) === JSON.stringify([1, 2, 3, 4]);
      },
      message: 'Assessment must have exactly 4 sections numbered 1-4'
    }
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Pre-save middleware to validate question numbers
AssessmentSchema.pre('save', function(next) {
  const allQuestionNumbers: number[] = [];
  
  this.sections.forEach(section => {
    section.questionSets.forEach(set => {
      set.questions.forEach(q => {
        allQuestionNumbers.push(q.number);
      });
    });
  });
  
  // Check for duplicate question numbers
  const uniqueNumbers = [...new Set(allQuestionNumbers)];
  if (uniqueNumbers.length !== allQuestionNumbers.length) {
    return next(new Error('Duplicate question numbers found'));
  }
  
  // Update totalQuestions
  this.totalQuestions = allQuestionNumbers.length;
  
  next();
});

// Indexes
AssessmentSchema.index({ title: 'text' });
AssessmentSchema.index({ difficulty: 1 });
AssessmentSchema.index({ isPublished: 1 });
AssessmentSchema.index({ createdAt: -1 });

export default mongoose.model<IAssessment>('Assessment', AssessmentSchema);
