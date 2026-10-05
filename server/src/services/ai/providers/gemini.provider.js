import { GoogleGenAI, Type } from '@google/genai';
import { BaseAIProvider } from './base.provider.js';
import { ENV } from '../../../config/env.js';
import { AppError } from '../../../utils/AppError.js';

export class GeminiProvider extends BaseAIProvider {
  constructor() {
    super();
    this.name = 'gemini';
  }

  /**
   * Analyze resume against job posting using Google Gemini API
   */
  async analyzeResumeAgainstJob({ resumeText, jobData }) {
    if (!ENV.GEMINI_API_KEY || !ENV.GEMINI_API_KEY.trim()) {
      throw new AppError(
        'Google Gemini API key is not configured. Please set GEMINI_API_KEY in server environment variables.',
        500,
        null,
        'AI_CONFIG_ERROR'
      );
    }

    const modelName = ENV.GEMINI_MODEL || 'gemini-3.5-flash-lite';
    const ai = new GoogleGenAI({ apiKey: ENV.GEMINI_API_KEY });

    const systemInstruction = `You are an expert AI Resume and Job Fit Evaluation Assistant for CareerAI.
Analyze the provided candidate resume text strictly against the target job posting description and required skills.

Strict Grounding Rules:
1. Do NOT invent experience, qualifications, projects, certifications, skills, employers, education, or achievements that are not supported by the resume text.
2. The analysis must be based strictly on the RESUME text and the JOB details provided, never on external speculation.
3. Identify matched skills that are explicitly or clearly demonstrated in the resume.
4. Identify missing skills that the job requires or expects which the resume does not demonstrate.
5. Provide constructive, actionable recommendations to bridge the gap.
6. Calculate an objective match score (0-100) representing qualification and skill alignment.
7. Provide a concise, professional summary for the candidate.`;

    const prompt = `Target Job Details:
- Title: ${jobData.title || 'Untitled'}
- Company: ${jobData.companyName || 'Confidential'}
- Location: ${jobData.location || 'Undisclosed'} (${jobData.workMode || 'Remote'})
- Employment Type: ${jobData.employmentType || 'Full-time'}
- Stated Skills: ${(jobData.skills || []).join(', ') || 'None specified'}
- Job Description:
${jobData.description || 'No detailed description provided.'}

Candidate Resume Text:
<<<RESUME_DATA>>>
${(resumeText || '').slice(0, 16000)}
<<<END_RESUME_DATA>>>

Return a structured JSON evaluation comparing this resume against the job requirements.`;

    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              matchScore: {
                type: Type.INTEGER,
                description: 'Overall match score between 0 and 100'
              },
              matchedSkills: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Skills explicitly present in the resume that match the job'
              },
              missingSkills: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Required or preferred skills missing from the candidate resume'
              },
              recommendations: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Actionable suggestions for the candidate to improve their fit or application'
              },
              summary: {
                type: Type.STRING,
                description: 'Comprehensive candidate-friendly analysis summary'
              }
            },
            required: ['matchScore', 'matchedSkills', 'missingSkills', 'recommendations', 'summary']
          }
        }
      });

      const rawText = response.text;
      if (!rawText) {
        throw new AppError('Gemini returned an empty response', 502, null, 'AI_RESPONSE_INVALID');
      }

      let parsed;
      try {
        parsed = JSON.parse(rawText);
      } catch (parseErr) {
        throw new AppError(
          `Failed to parse Gemini JSON output: ${parseErr.message}`,
          502,
          null,
          'AI_RESPONSE_INVALID'
        );
      }

      return {
        ...parsed,
        provider: 'gemini',
        model: modelName
      };
    } catch (err) {
      if (err instanceof AppError) {
        throw err;
      }

      // Check for rate limit
      if (err.status === 429 || (err.message && err.message.includes('429'))) {
        throw new AppError(
          'AI rate limit reached. Please wait a moment before analyzing again.',
          429,
          null,
          'AI_RATE_LIMIT'
        );
      }

      throw new AppError(
        `Gemini AI service error: ${err.message || 'Unknown provider error'}`,
        502,
        null,
        'AI_SERVICE_ERROR'
      );
    }
  }
}
