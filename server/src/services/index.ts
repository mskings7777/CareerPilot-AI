export { sendVerificationEmail, sendPasswordResetEmail } from './emailService';
export { extractTextFromFile, parseResumeText } from './resumeParser';
export { analyzeSkillGap, recommendCareers, generatePersonalizedRoadmap } from './careerEngine';
export { generateResumeCoachReport } from './resumeCoach';
export type {
  SkillGapResult,
  CareerMatch,
  PersonalizedRoadmap,
  PersonalizedRoadmapPhase,
  ExplainableFactor,
  SkillWeight,
  CategoryBreakdown,
} from './careerEngine';
export type {
  ResumeCoachReport,
  ResumeImprovementSuggestion,
  ResumeProjectSuggestion,
  ResumeTargetRole,
} from './resumeCoach';
