import mongoose from 'mongoose';

const resumeSchema = new mongoose.Schema(
  {
    candidate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CandidateProfile',
      required: [true, 'Candidate reference is required'],
      index: true
    },
    originalFileName: {
      type: String,
      required: [true, 'Original file name is required'],
      trim: true,
      maxlength: [255, 'File name cannot exceed 255 characters']
    },
    fileUrl: {
      type: String,
      required: [true, 'File URL is required'],
      trim: true
    },
    storageProvider: {
      type: String,
      enum: {
        values: ['local', 'cloudinary', 's3', 'test'],
        message: 'Invalid storage provider'
      },
      default: 'local'
    },
    storagePublicId: {
      type: String,
      trim: true
    },
    fileType: {
      type: String,
      trim: true,
      default: 'application/pdf'
    },
    fileSize: {
      type: Number,
      min: [0, 'File size cannot be negative']
    },
    parsedText: {
      type: String,
      select: false // Excluded from normal queries for performance
    },
    status: {
      type: String,
      enum: {
        values: ['uploaded', 'processing', 'processed', 'ready', 'failed'],
        message: 'Invalid resume status'
      },
      default: 'uploaded'
    },
    isDefault: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  {
    timestamps: true
  }
);

export const Resume = mongoose.model('Resume', resumeSchema);
export default Resume;
