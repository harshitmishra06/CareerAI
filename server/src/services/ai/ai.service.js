import { GeminiProvider } from './providers/gemini.provider.js';
import { MockAIProvider } from './providers/mock.provider.js';
import { ENV } from '../../config/env.js';
import { AppError } from '../../utils/AppError.js';

export class AIService {
  static geminiInstance = null;
  static mockInstance = null;
  static customProvider = null;

  /**
   * Set a custom provider instance for testing
   */
  static setCustomProvider(provider) {
    this.customProvider = provider;
  }

  /**
   * Clear any custom provider
   */
  static clearCustomProvider() {
    this.customProvider = null;
  }

  /**
   * Resolve active AI provider implementation
   */
  static getProvider(overrideProviderName = null) {
    if (this.customProvider) {
      return this.customProvider;
    }

    const providerType = overrideProviderName || (ENV.NODE_ENV === 'test' ? 'mock' : ENV.AI_PROVIDER);

    if (providerType === 'gemini') {
      if (!this.geminiInstance) {
        this.geminiInstance = new GeminiProvider();
      }
      return this.geminiInstance;
    }

    if (providerType === 'mock') {
      if (!this.mockInstance) {
        this.mockInstance = new MockAIProvider();
      }
      return this.mockInstance;
    }

    throw new AppError(
      `Unsupported AI provider: '${providerType}'. Supported providers are: 'gemini', 'mock'.`,
      500,
      null,
      'AI_CONFIG_ERROR'
    );
  }

  /**
   * Validate AI structured response shape against strict contract rules
   */
  static validateAIResponse(rawResponse) {
    if (!rawResponse || typeof rawResponse !== 'object') {
      throw new AppError('AI returned a non-object response', 502, null, 'AI_RESPONSE_INVALID');
    }

    const { matchScore, matchedSkills, missingSkills, recommendations, summary } = rawResponse;

    // 1. matchScore validation: must be a number between 0 and 100
    if (typeof matchScore !== 'number' || isNaN(matchScore) || matchScore < 0 || matchScore > 100) {
      throw new AppError(
        `AI response contains invalid matchScore: ${matchScore}. Expected number between 0 and 100.`,
        502,
        null,
        'AI_RESPONSE_INVALID'
      );
    }

    // 2. matchedSkills validation: must be array of strings
    if (!Array.isArray(matchedSkills) || !matchedSkills.every((s) => typeof s === 'string')) {
      throw new AppError(
        'AI response matchedSkills must be an array of strings',
        502,
        null,
        'AI_RESPONSE_INVALID'
      );
    }

    // 3. missingSkills validation: must be array of strings
    if (!Array.isArray(missingSkills) || !missingSkills.every((s) => typeof s === 'string')) {
      throw new AppError(
        'AI response missingSkills must be an array of strings',
        502,
        null,
        'AI_RESPONSE_INVALID'
      );
    }

    // 4. recommendations validation: must be array of strings
    if (!Array.isArray(recommendations) || !recommendations.every((r) => typeof r === 'string')) {
      throw new AppError(
        'AI response recommendations must be an array of strings',
        502,
        null,
        'AI_RESPONSE_INVALID'
      );
    }

    // 5. summary validation: must be a non-empty string
    if (typeof summary !== 'string' || !summary.trim()) {
      throw new AppError(
        'AI response summary must be a non-empty string',
        502,
        null,
        'AI_RESPONSE_INVALID'
      );
    }

    return true;
  }

  /**
   * Coordinate resume-job analysis through the configured provider with strict output validation
   */
  static async analyzeResumeAgainstJob({ resumeText, jobData, providerOverride = null }) {
    if (!resumeText || typeof resumeText !== 'string' || !resumeText.trim()) {
      throw new AppError('Resume text is required and cannot be empty for AI analysis', 400);
    }

    if (!jobData || !jobData.title) {
      throw new AppError('Job details with a valid title are required for AI analysis', 400);
    }

    const provider = this.getProvider(providerOverride);
    const rawResult = await provider.analyzeResumeAgainstJob({ resumeText, jobData });

    // Validate structured output
    this.validateAIResponse(rawResult);

    // Normalize and sanitize fields
    const sanitizedMatchedSkills = Array.from(
      new Set(rawResult.matchedSkills.map((s) => s.trim()).filter(Boolean))
    );
    const sanitizedMissingSkills = Array.from(
      new Set(rawResult.missingSkills.map((s) => s.trim()).filter(Boolean))
    );
    const sanitizedRecommendations = Array.from(
      new Set(rawResult.recommendations.map((r) => r.trim()).filter(Boolean))
    );
    const normalizedScore = Math.max(0, Math.min(100, Math.round(rawResult.matchScore)));
    const sanitizedSummary = rawResult.summary.trim().slice(0, 3000);

    return {
      matchScore: normalizedScore,
      matchedSkills: sanitizedMatchedSkills,
      missingSkills: sanitizedMissingSkills,
      recommendations: sanitizedRecommendations,
      summary: sanitizedSummary,
      provider: rawResult.provider || provider.name || 'unknown',
      model: rawResult.model || 'unknown'
    };
  }
}
