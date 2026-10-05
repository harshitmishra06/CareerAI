import mongoose from 'mongoose';

const resumeAnalysisSchema = new mongoose.Schema(
  {
    candidate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CandidateProfile',
      required: [true, 'Candidate reference is required'],
      index: true
    },
    resume: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resume',
      required: [true, 'Resume reference is required'],
      index: true
    },
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: [true, 'Job reference is required'],
      index: true
    },
    matchScore: {
      type: Number,
      required: [true, 'Match score is required'],
      min: [0, 'Match score cannot be less than 0'],
      max: [100, 'Match score cannot exceed 100']
    },
    matchedSkills: [
      {
        type: String,
        trim: true
      }
    ],
    missingSkills: [
      {
        type: String,
        trim: true
      }
    ],
    recommendations: [
      {
        type: String,
        trim: true
      }
    ],
    summary: {
      type: String,
      trim: true,
      maxlength: [3000, 'Summary cannot exceed 3000 characters']
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'processing', 'completed', 'failed'],
        message: 'Invalid analysis status'
      },
      default: 'pending'
    },
    provider: {
      type: String,
      trim: true
    },
    model: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

// Compound index for fast candidate + resume + job duplicate lookups
resumeAnalysisSchema.index({ candidate: 1, resume: 1, job: 1 });

export const ResumeAnalysis = mongoose.model('ResumeAnalysis', resumeAnalysisSchema);
export default ResumeAnalysis;
