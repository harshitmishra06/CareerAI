/**
 * Base AI Provider Abstract Interface
 */
export class BaseAIProvider {
  /**
   * Analyze candidate resume text against target job data
   * @param {Object} params
   * @param {string} params.resumeText
   * @param {Object} params.jobData
   * @returns {Promise<{ matchScore: number, matchedSkills: string[], missingSkills: string[], recommendations: string[], summary: string, provider: string, model: string }>}
   */
  async analyzeResumeAgainstJob({ resumeText, jobData }) {
    throw new Error('Method analyzeResumeAgainstJob must be implemented by subclass');
  }
}
