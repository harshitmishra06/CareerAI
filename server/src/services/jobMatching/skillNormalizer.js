/**
 * Skill Normalization and Comparison Utility
 *
 * Normalizes skill terminology to eliminate false mismatches caused by:
 * - Casing differences ("React" vs "react")
 * - Punctuation/spacing ("node.js" vs "nodejs" vs "node js")
 * - Standard technical aliases ("golang" vs "go", "amazon web services" vs "aws")
 */

// Canonical alias dictionary for ubiquitous industry terms
const SKILL_ALIASES = {
  // JavaScript Ecosystem
  'react.js': 'react',
  'reactjs': 'react',
  'react': 'react',
  'react native': 'react native',
  'react-native': 'react native',
  'node.js': 'node',
  'nodejs': 'node',
  'node': 'node',
  'express.js': 'express',
  'expressjs': 'express',
  'express': 'express',
  'vue.js': 'vue',
  'vuejs': 'vue',
  'vue': 'vue',
  'angular.js': 'angular',
  'angularjs': 'angular',
  'angular': 'angular',
  'next.js': 'nextjs',
  'nextjs': 'nextjs',
  'next': 'nextjs',
  'nest.js': 'nestjs',
  'nestjs': 'nestjs',
  'typescript': 'typescript',
  'ts': 'typescript',
  'javascript': 'javascript',
  'js': 'javascript',

  // Python & Data
  'python': 'python',
  'python3': 'python',
  'django': 'django',
  'flask': 'flask',
  'fastapi': 'fastapi',
  'pandas': 'pandas',
  'numpy': 'numpy',

  // Database Systems
  'mongodb': 'mongodb',
  'mongo': 'mongodb',
  'postgres': 'postgresql',
  'postgresql': 'postgresql',
  'mysql': 'mysql',
  'redis': 'redis',
  'sqlite': 'sqlite',

  // Cloud & DevOps
  'amazon web services': 'aws',
  'aws': 'aws',
  'google cloud': 'google cloud',
  'google cloud platform': 'google cloud',
  'gcp': 'google cloud',
  'microsoft azure': 'azure',
  'azure': 'azure',
  'docker': 'docker',
  'kubernetes': 'kubernetes',
  'k8s': 'kubernetes',
  'ci/cd': 'cicd',
  'ci-cd': 'cicd',
  'cicd': 'cicd',
  'git': 'git',
  'github': 'git',

  // APIs & Networking
  'rest': 'rest api',
  'restful': 'rest api',
  'rest api': 'rest api',
  'restful api': 'rest api',
  'rest apis': 'rest api',
  'restful apis': 'rest api',
  'graphql': 'graphql',

  // Languages & Core
  'golang': 'go',
  'go': 'go',
  'c++': 'c++',
  'cpp': 'c++',
  'c#': 'c#',
  'csharp': 'c#',
  '.net': '.net',
  'dotnet': '.net',
  'html': 'html',
  'html5': 'html',
  'css': 'css',
  'css3': 'css',
  'tailwind': 'tailwind css',
  'tailwindcss': 'tailwind css'
};

/**
 * Normalize a single skill string to a canonical token
 * @param {string} skill
 * @returns {string} Normalized canonical skill token
 */
export function normalizeSkill(skill) {
  if (!skill || typeof skill !== 'string') return '';
  const trimmed = skill.toLowerCase().trim();

  // Check alias dictionary
  if (SKILL_ALIASES[trimmed]) {
    return SKILL_ALIASES[trimmed];
  }

  // Strip non-essential punctuation and spacing while preserving C++ and C#
  return trimmed
    .replace(/[\.\-_]/g, '')
    .replace(/\s+/g, '');
}

/**
 * Determine if two skills match after normalization
 * @param {string} candidateSkill
 * @param {string} jobSkill
 * @returns {boolean}
 */
export function isSkillMatch(candidateSkill, jobSkill) {
  const normA = normalizeSkill(candidateSkill);
  const normB = normalizeSkill(jobSkill);

  if (!normA || !normB) return false;
  if (normA === normB) return true;

  // Fallback: Check if one contains the other (e.g. "react" in "react native" is NOT equal, but "rest api" matches "rest")
  if (normA.length > 3 && normB.length > 3) {
    if (normA.startsWith(normB) || normB.startsWith(normA)) {
      return true;
    }
  }

  return false;
}

/**
 * Calculate the overlap between candidate skills and job required skills
 * @param {string[]} candidateSkills - List of candidate skills
 * @param {string[]} jobSkills - List of job required skills
 * @returns {{ matchedSkills: string[], missingSkills: string[] }}
 */
export function calculateSkillOverlap(candidateSkills = [], jobSkills = []) {
  if (!Array.isArray(jobSkills) || jobSkills.length === 0) {
    return { matchedSkills: [], missingSkills: [] };
  }

  const normalizedCandidateSkills = (candidateSkills || [])
    .filter((s) => typeof s === 'string' && s.trim().length > 0)
    .map((s) => ({
      original: s,
      normalized: normalizeSkill(s)
    }));

  const matchedSkills = [];
  const missingSkills = [];

  for (const jobSkill of jobSkills) {
    if (!jobSkill || typeof jobSkill !== 'string') continue;
    const normJobSkill = normalizeSkill(jobSkill);

    // Look for match
    const hasMatch = normalizedCandidateSkills.some((cand) =>
      cand.normalized === normJobSkill || isSkillMatch(cand.original, jobSkill)
    );

    if (hasMatch) {
      matchedSkills.push(jobSkill);
    } else {
      missingSkills.push(jobSkill);
    }
  }

  return { matchedSkills, missingSkills };
}
