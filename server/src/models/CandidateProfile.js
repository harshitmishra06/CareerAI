import mongoose from 'mongoose';

const urlRegex = /^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)$/;

const educationSchema = new mongoose.Schema(
  {
    institution: {
      type: String,
      required: [true, 'Institution name is required'],
      trim: true,
      maxlength: [150, 'Institution name cannot exceed 150 characters']
    },
    degree: {
      type: String,
      required: [true, 'Degree is required'],
      trim: true,
      maxlength: [100, 'Degree cannot exceed 100 characters']
    },
    fieldOfStudy: {
      type: String,
      trim: true,
      maxlength: [100, 'Field of study cannot exceed 100 characters']
    },
    startDate: {
      type: Date
    },
    endDate: {
      type: Date,
      validate: {
        validator: function (value) {
          if (!this.startDate || !value) return true;
          return value >= this.startDate;
        },
        message: 'End date must be greater than or equal to start date'
      }
    },
    grade: {
      type: String,
      trim: true,
      maxlength: [50, 'Grade cannot exceed 50 characters']
    }
  },
  { _id: true }
);

const experienceSchema = new mongoose.Schema(
  {
    company: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
      maxlength: [150, 'Company name cannot exceed 150 characters']
    },
    jobTitle: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
      maxlength: [100, 'Job title cannot exceed 100 characters']
    },
    location: {
      type: String,
      trim: true,
      maxlength: [100, 'Location cannot exceed 100 characters']
    },
    startDate: {
      type: Date,
      required: [true, 'Experience start date is required']
    },
    endDate: {
      type: Date,
      validate: {
        validator: function (value) {
          if (this.currentlyWorking || !value || !this.startDate) return true;
          return value >= this.startDate;
        },
        message: 'End date must be greater than or equal to start date'
      }
    },
    currentlyWorking: {
      type: Boolean,
      default: false
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Experience description cannot exceed 2000 characters']
    }
  },
  { _id: true }
);

const candidateProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      unique: true,
      index: true
    },
    headline: {
      type: String,
      trim: true,
      maxlength: [120, 'Headline cannot exceed 120 characters']
    },
    bio: {
      type: String,
      trim: true,
      maxlength: [2000, 'Bio cannot exceed 2000 characters']
    },
    location: {
      type: String,
      trim: true,
      maxlength: [100, 'Location cannot exceed 100 characters']
    },
    phone: {
      type: String,
      trim: true,
      maxlength: [25, 'Phone number cannot exceed 25 characters']
    },
    skills: [
      {
        type: String,
        trim: true,
        lowercase: true,
        maxlength: [50, 'Skill name cannot exceed 50 characters']
      }
    ],
    education: [educationSchema],
    experience: [experienceSchema],
    portfolioUrl: {
      type: String,
      trim: true,
      match: [urlRegex, 'Please provide a valid portfolio URL']
    },
    githubUrl: {
      type: String,
      trim: true,
      match: [urlRegex, 'Please provide a valid GitHub URL']
    },
    linkedinUrl: {
      type: String,
      trim: true,
      match: [urlRegex, 'Please provide a valid LinkedIn URL']
    }
  },
  {
    timestamps: true
  }
);

candidateProfileSchema.index({ skills: 1 });

export const CandidateProfile = mongoose.model('CandidateProfile', candidateProfileSchema);
export default CandidateProfile;
