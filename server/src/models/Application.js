import mongoose from 'mongoose';

const applicationSchema = new mongoose.Schema(
  {
    candidate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CandidateProfile',
      required: [true, 'Candidate reference is required'],
      index: true
    },
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: [true, 'Job reference is required'],
      index: true
    },
    resume: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resume',
      default: null
    },
    coverLetter: {
      type: String,
      trim: true,
      maxlength: [4000, 'Cover letter cannot exceed 4000 characters']
    },
    status: {
      type: String,
      enum: {
        values: ['applied', 'screening', 'shortlisted', 'interview', 'selected', 'rejected', 'withdrawn'],
        message: 'Invalid application status'
      },
      default: 'applied',
      index: true
    },
    appliedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// Compound unique index ensuring one application per candidate per job
applicationSchema.index({ candidate: 1, job: 1 }, { unique: true });

export const Application = mongoose.model('Application', applicationSchema);
export default Application;
