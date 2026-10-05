import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema(
  {
    recruiter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RecruiterProfile',
      required: [true, 'Recruiter reference is required'],
      index: true
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company reference is required'],
      index: true
    },
    title: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
      minlength: [3, 'Job title must be at least 3 characters long'],
      maxlength: [150, 'Job title cannot exceed 150 characters'],
      index: true
    },
    description: {
      type: String,
      required: [true, 'Job description is required'],
      trim: true,
      minlength: [20, 'Job description must be at least 20 characters long']
    },
    skills: [
      {
        type: String,
        trim: true,
        lowercase: true
      }
    ],
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
      maxlength: [150, 'Location cannot exceed 150 characters'],
      index: true
    },
    employmentType: {
      type: String,
      required: [true, 'Employment type is required'],
      enum: {
        values: ['full-time', 'part-time', 'contract', 'internship', 'freelance'],
        message: 'Invalid employment type'
      },
      default: 'full-time'
    },
    workMode: {
      type: String,
      required: [true, 'Work mode is required'],
      enum: {
        values: ['onsite', 'hybrid', 'remote'],
        message: 'Invalid work mode'
      },
      default: 'onsite'
    },
    experienceMin: {
      type: Number,
      default: 0,
      min: [0, 'Minimum experience cannot be negative']
    },
    experienceMax: {
      type: Number,
      min: [0, 'Maximum experience cannot be negative'],
      validate: {
        validator: function (value) {
          if (value == null || this.experienceMin == null) return true;
          return value >= this.experienceMin;
        },
        message: 'Maximum experience must be greater than or equal to minimum experience'
      }
    },
    salaryMin: {
      type: Number,
      min: [0, 'Minimum salary cannot be negative']
    },
    salaryMax: {
      type: Number,
      min: [0, 'Maximum salary cannot be negative'],
      validate: {
        validator: function (value) {
          if (value == null || this.salaryMin == null) return true;
          return value >= this.salaryMin;
        },
        message: 'Maximum salary must be greater than or equal to minimum salary'
      }
    },
    salaryCurrency: {
      type: String,
      default: 'USD',
      uppercase: true,
      trim: true,
      maxlength: [5, 'Currency code cannot exceed 5 characters']
    },
    status: {
      type: String,
      enum: {
        values: ['draft', 'published', 'closed', 'expired'],
        message: 'Invalid job status'
      },
      default: 'draft',
      index: true
    },
    publishedAt: {
      type: Date
    },
    expiresAt: {
      type: Date,
      validate: {
        validator: function (value) {
          if (!this.publishedAt || !value) return true;
          return value >= this.publishedAt;
        },
        message: 'Expiration date must be after publication date'
      }
    }
  },
  {
    timestamps: true
  }
);

jobSchema.index({ skills: 1 });
jobSchema.index({ title: 'text', description: 'text', skills: 'text' });

export const Job = mongoose.model('Job', jobSchema);
export default Job;
