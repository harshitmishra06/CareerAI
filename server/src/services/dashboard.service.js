import mongoose from 'mongoose';
import {
  Application,
  CandidateProfile,
  RecruiterProfile,
  Job,
  Company,
  Resume,
  ResumeAnalysis
} from '../models/index.js';
import { JobMatchingService } from './jobMatching/jobMatching.service.js';
import { AppError } from '../utils/AppError.js';

export class DashboardService {
  /**
   * Helper: Retrieve candidate profile for authenticated user
   */
  static async getCandidateProfile(userId) {
    return CandidateProfile.findOne({ user: userId });
  }

  /**
   * Helper: Retrieve recruiter profile for authenticated user
   */
  static async getRecruiterProfile(userId) {
    return RecruiterProfile.findOne({ user: userId });
  }

  /**
   * Candidate Dashboard Summary
   */
  static async getCandidateDashboard(userId) {
    const candidateProfile = await this.getCandidateProfile(userId);

    if (!candidateProfile) {
      return {
        applications: {
          total: 0,
          applied: 0,
          screening: 0,
          shortlisted: 0,
          interview: 0,
          selected: 0,
          rejected: 0,
          withdrawn: 0,
          recent: []
        },
        resumes: {
          total: 0,
          ready: 0,
          recent: null
        },
        ai: {
          total: 0,
          averageScore: 0,
          recent: null
        },
        matches: {
          totalRecommended: 0,
          highestScore: 0,
          topMatches: []
        }
      };
    }

    const candidateId = candidateProfile._id;

    // 1. Applications aggregation & recent list
    const [appStatsResult, recentApplications] = await Promise.all([
      Application.aggregate([
        { $match: { candidate: candidateId } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Application.find({ candidate: candidateId })
        .sort({ appliedAt: -1, createdAt: -1 })
        .limit(5)
        .populate({
          path: 'job',
          select: 'title location workMode employmentType status salaryMin salaryMax salaryCurrency company',
          populate: { path: 'company', select: 'name logoUrl location industry isVerified' }
        })
        .lean()
    ]);

    const statusCounts = {
      applied: 0,
      screening: 0,
      shortlisted: 0,
      interview: 0,
      selected: 0,
      rejected: 0,
      withdrawn: 0
    };

    let totalApplications = 0;
    for (const item of appStatsResult) {
      if (statusCounts[item._id] !== undefined) {
        statusCounts[item._id] = item.count;
      }
      totalApplications += item.count;
    }

    // 2. Resumes stats
    const [resumeStatsResult, recentResume] = await Promise.all([
      Resume.aggregate([
        { $match: { candidate: candidateId } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            ready: {
              $sum: {
                $cond: [{ $in: ['$status', ['ready', 'processed']] }, 1, 0]
              }
            }
          }
        }
      ]),
      Resume.findOne({ candidate: candidateId })
        .sort({ updatedAt: -1, createdAt: -1 })
        .select('originalFileName fileSize fileType status isDefault updatedAt createdAt')
        .lean()
    ]);

    const totalResumes = resumeStatsResult[0]?.total || 0;
    const readyResumes = resumeStatsResult[0]?.ready || 0;

    // 3. AI Resume Analysis stats
    const [aiStatsResult, recentAnalysis] = await Promise.all([
      ResumeAnalysis.aggregate([
        { $match: { candidate: candidateId } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            avgScore: { $avg: '$matchScore' }
          }
        }
      ]),
      ResumeAnalysis.findOne({ candidate: candidateId })
        .sort({ createdAt: -1 })
        .select('matchScore status summary matchedSkills missingSkills createdAt job')
        .populate({
          path: 'job',
          select: 'title company',
          populate: { path: 'company', select: 'name logoUrl' }
        })
        .lean()
    ]);

    const totalAnalyses = aiStatsResult[0]?.total || 0;
    const averageScore = Math.round(aiStatsResult[0]?.avgScore || 0);

    // 4. Job Matching Recommendations (deterministic, no Gemini calls)
    let matchStats = {
      totalRecommended: 0,
      highestScore: 0,
      topMatches: []
    };

    try {
      const matchResult = await JobMatchingService.getCandidateJobMatches(userId, { limit: 5 });
      if (matchResult && matchResult.matches) {
        matchStats.totalRecommended = matchResult.totalMatches || matchResult.matches.length;
        matchStats.highestScore = matchResult.matches[0]?.matchScore || 0;
        matchStats.topMatches = matchResult.matches.slice(0, 5);
      }
    } catch (err) {
      console.error('Job matching aggregation fallback:', err.message);
    }

    return {
      applications: {
        total: totalApplications,
        ...statusCounts,
        recent: recentApplications
      },
      resumes: {
        total: totalResumes,
        ready: readyResumes,
        recent: recentResume
      },
      ai: {
        total: totalAnalyses,
        averageScore,
        recent: recentAnalysis
      },
      matches: matchStats
    };
  }

  /**
   * Employer Dashboard Summary
   */
  static async getEmployerDashboard(userId) {
    const recruiterProfile = await this.getRecruiterProfile(userId);

    if (!recruiterProfile) {
      return {
        company: {
          managedCount: 0,
          details: null
        },
        jobs: {
          total: 0,
          published: 0,
          draft: 0,
          closed: 0,
          recent: []
        },
        applications: {
          total: 0,
          applied: 0,
          screening: 0,
          shortlisted: 0,
          interview: 0,
          selected: 0,
          rejected: 0,
          withdrawn: 0,
          recent: []
        }
      };
    }

    // 1. Company details
    let companyDetails = null;
    let managedCount = 0;
    if (recruiterProfile.company) {
      companyDetails = await Company.findById(recruiterProfile.company)
        .select('name logoUrl website industry companySize isVerified location')
        .lean();
      if (companyDetails) {
        managedCount = 1;
      }
    }

    // 2. Jobs stats
    const recruiterId = recruiterProfile._id;
    const [jobStatsResult, recentJobs, allRecruiterJobs] = await Promise.all([
      Job.aggregate([
        { $match: { recruiter: recruiterId } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Job.find({ recruiter: recruiterId })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('title status location workMode employmentType publishedAt createdAt')
        .lean(),
      Job.find({ recruiter: recruiterId }).select('_id').lean()
    ]);

    const jobCounts = {
      published: 0,
      draft: 0,
      closed: 0
    };

    let totalJobs = 0;
    for (const item of jobStatsResult) {
      if (jobCounts[item._id] !== undefined) {
        jobCounts[item._id] = item.count;
      }
      totalJobs += item.count;
    }

    // 3. Applications for all jobs managed by this recruiter
    const jobIds = allRecruiterJobs.map((j) => j._id);

    const appStatusCounts = {
      applied: 0,
      screening: 0,
      shortlisted: 0,
      interview: 0,
      selected: 0,
      rejected: 0,
      withdrawn: 0
    };

    let totalApplications = 0;
    let recentApplications = [];

    if (jobIds.length > 0) {
      const [appStatsResult, recentApps] = await Promise.all([
        Application.aggregate([
          { $match: { job: { $in: jobIds } } },
          { $group: { _id: '$status', count: { $sum: 1 } } }
        ]),
        Application.find({ job: { $in: jobIds } })
          .sort({ appliedAt: -1, createdAt: -1 })
          .limit(5)
          .populate({
            path: 'candidate',
            select: 'headline location skills user',
            populate: { path: 'user', select: 'name email' }
          })
          .populate({
            path: 'job',
            select: 'title status location'
          })
          .populate({
            path: 'resume',
            select: 'originalFileName fileSize status'
          })
          .lean()
      ]);

      for (const item of appStatsResult) {
        if (appStatusCounts[item._id] !== undefined) {
          appStatusCounts[item._id] = item.count;
        }
        totalApplications += item.count;
      }
      recentApplications = recentApps;
    }

    return {
      company: {
        managedCount,
        details: companyDetails
      },
      jobs: {
        total: totalJobs,
        published: jobCounts.published,
        draft: jobCounts.draft,
        closed: jobCounts.closed,
        recent: recentJobs
      },
      applications: {
        total: totalApplications,
        ...appStatusCounts,
        recent: recentApplications
      }
    };
  }

  /**
   * Candidate Detailed Analytics
   */
  static async getCandidateAnalytics(userId) {
    const candidateProfile = await this.getCandidateProfile(userId);
    if (!candidateProfile) {
      return {
        applicationsByStatus: [],
        applicationsOverTime: [],
        scoreDistribution: {
          low: 0,
          moderate: 0,
          strong: 0,
          excellent: 0,
          average: 0
        },
        totalApplications: 0,
        totalAnalyses: 0
      };
    }

    const candidateId = candidateProfile._id;

    const [statusStats, timeStats, scoreStats] = await Promise.all([
      // Status breakdown
      Application.aggregate([
        { $match: { candidate: candidateId } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      // Applications over time (by month)
      Application.aggregate([
        { $match: { candidate: candidateId } },
        {
          $group: {
            _id: {
              year: { $year: '$appliedAt' },
              month: { $month: '$appliedAt' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ]),
      // Resume analysis score distribution
      ResumeAnalysis.aggregate([
        { $match: { candidate: candidateId } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            avgScore: { $avg: '$matchScore' },
            low: {
              $sum: { $cond: [{ $lt: ['$matchScore', 50] }, 1, 0] }
            },
            moderate: {
              $sum: {
                $cond: [
                  { $and: [{ $gte: ['$matchScore', 50] }, { $lt: ['$matchScore', 70] }] },
                  1,
                  0
                ]
              }
            },
            strong: {
              $sum: {
                $cond: [
                  { $and: [{ $gte: ['$matchScore', 70] }, { $lt: ['$matchScore', 85] }] },
                  1,
                  0
                ]
              }
            },
            excellent: {
              $sum: { $cond: [{ $gte: ['$matchScore', 85] }, 1, 0] }
            }
          }
        }
      ])
    ]);

    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    const formattedTime = timeStats.map((item) => ({
      period: `${monthNames[item._id.month - 1]} ${item._id.year}`,
      count: item.count
    }));

    const totalApplications = statusStats.reduce((sum, s) => sum + s.count, 0);

    const scoreData = scoreStats[0] || {
      low: 0,
      moderate: 0,
      strong: 0,
      excellent: 0,
      avgScore: 0,
      total: 0
    };

    return {
      applicationsByStatus: statusStats.map((s) => ({ status: s._id, count: s.count })),
      applicationsOverTime: formattedTime,
      scoreDistribution: {
        low: scoreData.low || 0,
        moderate: scoreData.moderate || 0,
        strong: scoreData.strong || 0,
        excellent: scoreData.excellent || 0,
        average: Math.round(scoreData.avgScore || 0)
      },
      totalApplications,
      totalAnalyses: scoreData.total || 0
    };
  }

  /**
   * Employer Detailed Analytics
   */
  static async getEmployerAnalytics(userId) {
    const recruiterProfile = await this.getRecruiterProfile(userId);
    if (!recruiterProfile) {
      return {
        applicationsByStatus: [],
        applicationsOverTime: [],
        topJobsByApplications: [],
        jobStatusDistribution: [],
        totalApplications: 0,
        totalJobs: 0
      };
    }

    const recruiterId = recruiterProfile._id;
    const recruiterJobs = await Job.find({ recruiter: recruiterId })
      .select('_id title status')
      .lean();

    const jobIds = recruiterJobs.map((j) => j._id);
    const jobTitleMap = new Map();
    recruiterJobs.forEach((j) => jobTitleMap.set(j._id.toString(), j.title));

    // Job status breakdown
    const jobStatusCounts = { published: 0, draft: 0, closed: 0 };
    recruiterJobs.forEach((j) => {
      if (jobStatusCounts[j.status] !== undefined) {
        jobStatusCounts[j.status] += 1;
      }
    });

    const jobStatusDistribution = Object.entries(jobStatusCounts).map(([status, count]) => ({
      status,
      count
    }));

    if (jobIds.length === 0) {
      return {
        applicationsByStatus: [],
        applicationsOverTime: [],
        topJobsByApplications: [],
        jobStatusDistribution,
        totalApplications: 0,
        totalJobs: recruiterJobs.length
      };
    }

    const [statusStats, timeStats, topJobsStats] = await Promise.all([
      // Status breakdown
      Application.aggregate([
        { $match: { job: { $in: jobIds } } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      // Applications over time
      Application.aggregate([
        { $match: { job: { $in: jobIds } } },
        {
          $group: {
            _id: {
              year: { $year: '$appliedAt' },
              month: { $month: '$appliedAt' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ]),
      // Top jobs by application count
      Application.aggregate([
        { $match: { job: { $in: jobIds } } },
        { $group: { _id: '$job', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ])
    ]);

    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    const formattedTime = timeStats.map((item) => ({
      period: `${monthNames[item._id.month - 1]} ${item._id.year}`,
      count: item.count
    }));

    const topJobs = topJobsStats.map((item) => ({
      jobId: item._id,
      title: jobTitleMap.get(item._id.toString()) || 'Untitled Job',
      applicationCount: item.count
    }));

    const totalApplications = statusStats.reduce((sum, s) => sum + s.count, 0);

    return {
      applicationsByStatus: statusStats.map((s) => ({ status: s._id, count: s.count })),
      applicationsOverTime: formattedTime,
      topJobsByApplications: topJobs,
      jobStatusDistribution,
      totalApplications,
      totalJobs: recruiterJobs.length
    };
  }
}

export default DashboardService;
