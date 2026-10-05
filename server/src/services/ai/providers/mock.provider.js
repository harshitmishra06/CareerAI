import { BaseAIProvider } from './base.provider.js';

export class MockAIProvider extends BaseAIProvider {
  constructor() {
    super();
    this.name = 'mock';
  }

  /**
   * Deterministic mock resume-job analyzer for automated tests and offline development
   */
  async analyzeResumeAgainstJob({ resumeText, jobData }) {
    const textLower = (resumeText || '').toLowerCase();
    const jobSkills = Array.isArray(jobData.skills) && jobData.skills.length > 0
      ? jobData.skills
      : ['JavaScript', 'React', 'Node.js', 'Teamwork'];

    const matchedSkills = [];
    const missingSkills = [];

    jobSkills.forEach((skill) => {
      const cleanSkill = skill.trim();
      if (!cleanSkill) return;
      const pattern = new RegExp(`\\b${cleanSkill.toLowerCase()}\\b`, 'i');
      if (pattern.test(textLower) || textLower.includes(cleanSkill.toLowerCase())) {
        matchedSkills.push(cleanSkill);
      } else {
        missingSkills.push(cleanSkill);
      }
    });

    // Calculate match score
    const skillRatio = jobSkills.length > 0 ? matchedSkills.length / jobSkills.length : 0.7;
    // Add weighting for length/substance
    const lengthBonus = Math.min(20, Math.floor((resumeText || '').length / 200));
    const baseScore = Math.round(skillRatio * 80 + lengthBonus);
    const matchScore = Math.max(10, Math.min(98, baseScore));

    const recommendations = [];
    if (missingSkills.length > 0) {
      recommendations.push(
        `Highlight practical experience or certifications in ${missingSkills.slice(0, 3).join(', ')}.`
      );
    }
    recommendations.push(
      `Tailor your professional summary to reflect the key responsibilities of ${jobData.title || 'this role'}.`
    );
    recommendations.push(
      'Quantify your technical achievements with specific impact metrics (e.g., performance improvements, uptime, cost reductions).'
    );

    const summary = `Based on our AI analysis, your resume demonstrates a ${matchScore}% match for the ${
      jobData.title || 'target'
    } position at ${jobData.companyName || 'the target company'}. You have strong foundational alignment in ${
      matchedSkills.length > 0 ? matchedSkills.slice(0, 4).join(', ') : 'core domain capabilities'
    }, with opportunities to further address ${
      missingSkills.length > 0 ? missingSkills.slice(0, 3).join(', ') : 'specialized requirements'
    }.`;

    return {
      matchScore,
      matchedSkills,
      missingSkills,
      recommendations,
      summary,
      provider: 'mock',
      model: 'mock-analyzer-v1'
    };
  }
}
