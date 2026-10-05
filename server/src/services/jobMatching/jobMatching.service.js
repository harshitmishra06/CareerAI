import mongoose from 'mongoose';
import { Job, CandidateProfile, Resume } from '../../models/index.js';
import { calculateSkillOverlap, normalizeSkill } from './skillNormalizer.js';
import { AppError } from '../../utils/AppError.js';

export class JobMatchingService {
  /**
   * Helper: Calculate total years of experience from candidate profile
   * @param {Array} experienceList - Array of experience subdocuments
   * @returns {number} Experience in years (rounded to 1 decimal place)
   */
  static calculateYearsOfExperience(experienceList = []) {
    if (!Array.isArray(experienceList) || experienceList.length === 0) {
      return 0;
    }

    let totalMonths = 0;
    for (const exp of experienceList) {
      if (!exp.startDate) continue;
      const start = new Date(exp.startDate);
      const end = exp.currentlyWorking ? new Date() : (exp.endDate ? new Date(exp.endDate) : new Date());

      if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end > start) {
        const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
        totalMonths += Math.max(0, months);
      }
    }

    return Math.round((totalMonths / 12) * 10) / 10;
  }

  /**
   * Helper: Extract additional skills from verified resume text (if available)
   * @param {string} resumeText
   * @param {Array<string>} baseSkills
   * @returns {Array<string>} Combined unique skills
   */
  static extractEffectiveCandidateSkills(baseSkills = [], readyResumes = []) {
    const skillSet = new Set((baseSkills || []).map((s) => s.trim().toLowerCase()));

    // Supplement with any skills found in ready resumes
    for (const resume of readyResumes) {
      if (!resume.parsedText || typeof resume.parsedText !== 'string') continue;
      const lowerText = resume.parsedText.toLowerCase();

      // Check common technical terms to see if they appear in resume text
      const candidateTerms = [
        'react', 'node.js', 'mongodb', 'express', 'typescript', 'javascript',
        'python', 'docker', 'aws', 'kubernetes', 'graphql', 'sql', 'postgresql',
        'redis', 'git', 'c++', 'c#', 'java', 'html', 'css', 'next.js', 'vue',
        'angular', 'rest api', 'ci/cd', 'tailwind', 'microservices', 'jest'
      ];

      for (const term of candidateTerms) {
        if (lowerText.includes(term)) {
          skillSet.add(term);
        }
      }
    }

    return Array.from(skillSet);
  }

  /**
   * Deterministic Job Match Calculation Engine
   * Calculates a match score (0-100), matched/missing skills, and a concise explanation.
   *
   * Scoring Breakdown:
   * 1. Skill Overlap (0-75 points): Ratio of matched job skills to required job skills
   * 2. Experience Fit (0-20 points): Meeting or approaching job experience requirement
   * 3. Work Mode & Location Bonus (0-5 points): Remote work mode or location match
   *
   * @param {Object} candidateData - { skills, yearsExp, location }
   * @param {Object} job - Job document or lean object
   * @returns {Object} Match details { matchScore, matchedSkills, missingSkills, explanation }
   */
  static calculateJobMatch(candidateData, job) {
    const jobSkills = job.skills || job.skillsRequired || [];
    const candidateSkills = candidateData.skills || [];
    const candidateExp = candidateData.yearsExp || 0;
    const candidateLocation = (candidateData.location || '').toLowerCase().trim();

    // 1. Skill Overlap Calculation
    const { matchedSkills, missingSkills } = calculateSkillOverlap(candidateSkills, jobSkills);

    let skillScore = 0;
    if (jobSkills.length > 0) {
      const matchRatio = matchedSkills.length / jobSkills.length;
      skillScore = Math.round(matchRatio * 75);
    } else {
      // If job specifies no specific required skills, assign neutral baseline (50/75)
      skillScore = 50;
    }

    // 2. Experience Fit Calculation (0-20 points)
    let experienceScore = 0;
    const jobExpMin = Number(job.experienceMin) || 0;
    if (jobExpMin === 0) {
      // Entry-friendly or no min experience specified
      experienceScore = 20;
    } else if (candidateExp >= jobExpMin) {
      experienceScore = 20;
    } else if (candidateExp > 0) {
      // Partial credit for experience approaching the requirement
      experienceScore = Math.round((candidateExp / jobExpMin) * 20);
    } else {
      experienceScore = 0;
    }

    // 3. Work Mode & Location Bonus (0-5 points)
    let bonusScore = 0;
    const jobWorkMode = (job.workMode || '').toLowerCase();
    const jobLocation = (job.location || '').toLowerCase();

    if (jobWorkMode === 'remote') {
      bonusScore = 5;
    } else if (candidateLocation && jobLocation && (jobLocation.includes(candidateLocation) || candidateLocation.includes(jobLocation))) {
      bonusScore = 5;
    } else {
      bonusScore = 3; // Baseline hybrid/neutral
    }

    // Total Match Score bounded strictly between 0 and 100
    const rawTotal = skillScore + experienceScore + bonusScore;
    const matchScore = Math.min(100, Math.max(0, rawTotal));

    // 4. Generate Concise Explanation
    let explanation = '';
    if (jobSkills.length === 0) {
      explanation = 'Matches general role specifications; no specialized technical skill requirements were stated.';
    } else if (matchedSkills.length === jobSkills.length && jobSkills.length > 0) {
      explanation = `Outstanding match! You fulfill all ${jobSkills.length} required skills (${matchedSkills.join(', ')}) with relevant experience.`;
    } else if (matchScore >= 75) {
      explanation = `Strong match: Satisfies ${matchedSkills.length} of ${jobSkills.length} required skills with aligned experience.`;
    } else if (matchScore >= 50) {
      explanation = `Moderate match: Overlap in ${matchedSkills.length} skills (${matchedSkills.slice(0, 3).join(', ')}). Potential gaps in: ${missingSkills.slice(0, 3).join(', ')}.`;
    } else {
      explanation = `Growth opportunity: Role prioritizes ${missingSkills.slice(0, 3).join(', ')} which are not yet prominent in your profile.`;
    }

    return {
      matchScore,
      matchedSkills,
      missingSkills,
      explanation
    };
  }

  /**
   * Retrieve personalized job matches for authenticated candidate
   * @param {string} userId - Authenticated user ID
   * @param {Object} query - Query parameters (page, limit, minScore, workMode, search)
   * @returns {Promise<Object>} Paginated job matches
   */
  static async getCandidateJobMatches(userId, query = {}) {
    const {
      page = 1,
      limit = 10,
      minScore = 0,
      workMode,
      search
    } = query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
    const minScoreNum = Math.max(0, Math.min(100, parseInt(minScore, 10) || 0));

    // 1. Fetch Candidate Profile
    const candidateProfile = await CandidateProfile.findOne({ user: userId });
    if (!candidateProfile) {
      throw new AppError('Candidate profile not found. Please complete your profile to receive job matches.', 404);
    }

    // 2. Compute candidate experience and effective skills
    const candidateYearsExp = this.calculateYearsOfExperience(candidateProfile.experience);

    // Fetch verified/ready resumes to incorporate resume skills
    const readyResumes = await Resume.find({
      candidate: candidateProfile._id,
      status: 'ready'
    }).select('+parsedText');

    const effectiveSkills = this.extractEffectiveCandidateSkills(candidateProfile.skills, readyResumes);

    const candidateData = {
      skills: effectiveSkills,
      yearsExp: candidateYearsExp,
      location: candidateProfile.location
    };

    // 3. Query ONLY published jobs (Strict Security: Draft/Closed jobs excluded)
    const jobFilter = { status: 'published' };

    if (workMode && ['onsite', 'hybrid', 'remote'].includes(workMode.toLowerCase())) {
      jobFilter.workMode = workMode.toLowerCase();
    }

    if (search && typeof search === 'string' && search.trim().length > 0) {
      const term = search.trim();
      jobFilter.$or = [
        { title: { $regex: term, $options: 'i' } },
        { description: { $regex: term, $options: 'i' } },
        { location: { $regex: term, $options: 'i' } }
      ];
    }

    const allPublishedJobs = await Job.find(jobFilter)
      .populate('company', 'name slug logoUrl industry location isVerified')
      .select('-__v')
      .lean();

    // 4. Calculate matches in-memory
    const scoredMatches = [];
    for (const job of allPublishedJobs) {
      const matchResult = this.calculateJobMatch(candidateData, job);

      // Filter by minScore if specified
      if (matchResult.matchScore >= minScoreNum) {
        scoredMatches.push({
          job,
          matchScore: matchResult.matchScore,
          matchedSkills: matchResult.matchedSkills,
          missingSkills: matchResult.missingSkills,
          explanation: matchResult.explanation
        });
      }
    }

    // 5. Sort matches: Highest match score first, then newest published
    scoredMatches.sort((a, b) => {
      if (b.matchScore !== a.matchScore) {
        return b.matchScore - a.matchScore;
      }
      return new Date(b.job.publishedAt || b.job.createdAt) - new Date(a.job.publishedAt || a.job.createdAt);
    });

    // 6. Paginate results
    const total = scoredMatches.length;
    const totalPages = Math.ceil(total / limitNum) || 1;
    const startIndex = (pageNum - 1) * limitNum;
    const paginatedMatches = scoredMatches.slice(startIndex, startIndex + limitNum);

    return {
      matches: paginatedMatches,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
        hasNextPage: startIndex + limitNum < total,
        hasPrevPage: pageNum > 1
      },
      meta: {
        candidateSkillsCount: effectiveSkills.length,
        experienceYears: candidateYearsExp,
        totalEligibleJobs: allPublishedJobs.length
      }
    };
  }

  /**
   * Retrieve match details for a specific published job for the candidate
   * @param {string} userId - Authenticated user ID
   * @param {string} jobId - Target job ID
   * @returns {Promise<Object>} Match details for target job
   */
  static async getJobMatchDetails(userId, jobId) {
    if (!jobId || !mongoose.Types.ObjectId.isValid(jobId)) {
      throw new AppError('Valid Job ID is required', 400);
    }

    const candidateProfile = await CandidateProfile.findOne({ user: userId });
    if (!candidateProfile) {
      throw new AppError('Candidate profile not found', 404);
    }

    // Ensure job is published
    const job = await Job.findOne({ _id: jobId, status: 'published' })
      .populate('company', 'name slug logoUrl industry location isVerified')
      .lean();

    if (!job) {
      throw new AppError('Published job not found or position is no longer active', 404);
    }

    const candidateYearsExp = this.calculateYearsOfExperience(candidateProfile.experience);
    const readyResumes = await Resume.find({
      candidate: candidateProfile._id,
      status: 'ready'
    }).select('+parsedText');

    const effectiveSkills = this.extractEffectiveCandidateSkills(candidateProfile.skills, readyResumes);

    const matchResult = this.calculateJobMatch(
      {
        skills: effectiveSkills,
        yearsExp: candidateYearsExp,
        location: candidateProfile.location
      },
      job
    );

    return {
      job,
      matchScore: matchResult.matchScore,
      matchedSkills: matchResult.matchedSkills,
      missingSkills: matchResult.missingSkills,
      explanation: matchResult.explanation
    };
  }
}

export default JobMatchingService;
