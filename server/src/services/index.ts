export { sendVerificationEmail, sendPasswordResetEmail } from './emailService';
export { extractTextFromFile, parseResumeText } from './resumeParser';
export { analyzeSkillGap, recommendCareers, generatePersonalizedRoadmap } from './careerEngine';
export type {
  SkillGapResult,
  CareerMatch,
  PersonalizedRoadmap,
  PersonalizedRoadmapPhase,
  ExplainableFactor,
  SkillWeight,
  CategoryBreakdown,
} from './careerEngine';
