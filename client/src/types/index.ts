// User types
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  isEmailVerified: boolean;
  role: string;
  profile?: UserProfile;
  createdAt?: string;
}

export interface UserProfile {
  phone?: string;
  location?: string;
  bio?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  currentRole?: string;
  yearsOfExperience?: number;
  education?: Education[];
}

export interface Education {
  degree: string;
  field: string;
  institution: string;
  year?: number;
}

// Auth types
export interface AuthResponse {
  success: boolean;
  message?: string;
  data: {
    token: string;
    user: User;
  };
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

// Resume types
export interface ResumeExperience {
  title: string;
  company: string;
  duration: string;
  description: string;
}

export interface ResumeEducation {
  degree: string;
  field: string;
  institution: string;
  year?: number;
}

export interface ParsedResume {
  skills: string[];
  experience: ResumeExperience[];
  education: ResumeEducation[];
  certifications: string[];
  summary?: string;
}

export interface Resume {
  _id: string;
  userId: string;
  originalFilename: string;
  fileType: 'pdf' | 'docx';
  parsed: ParsedResume;
  isProcessed: boolean;
  processedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Career types
export interface CareerPath {
  _id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  requiredSkills: string[];
  optionalSkills: string[];
  averageSalary: {
    min: number;
    max: number;
    currency: string;
  };
  demandLevel: 'high' | 'medium' | 'low';
  growthOutlook: string;
  learningResources: LearningResource[];
  roadmap: RoadmapPhase[];
}

export interface LearningResource {
  title: string;
  url: string;
  type: 'course' | 'certification' | 'book' | 'tutorial' | 'bootcamp';
  provider: string;
  isFree: boolean;
}

export interface RoadmapPhase {
  phase: number;
  title: string;
  description: string;
  skills: string[];
  durationWeeks: number;
}

// Explainable AI types
export interface ExplainableFactor {
  factor: string;
  score: number;
  maxScore: number;
  weight: number;
  description: string;
}

export interface CareerMatch {
  careerPath: {
    id: string;
    title: string;
    description: string;
    demandLevel: string;
    averageSalary: { min: number; max: number; currency: string };
  };
  matchScore: number;
  skillFitScore: number;
  demandScore: number;
  growthScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  explanation: string;
  factors: ExplainableFactor[];
  cosineSimilarity: number;
}

// Skill Weight (from TF-IDF analysis)
export interface SkillWeight {
  skill: string;
  tfidf: number;
  category: string;
  demandLevel: 'high' | 'medium' | 'low';
  proficiency: 'beginner' | 'intermediate' | 'advanced';
}

// Skill Gap types
export interface SkillGap {
  currentSkills: string[];
  requiredSkills: string[];
  matchedSkills: SkillWeight[];
  missingSkills: SkillWeight[];
  matchScore: number;
  gapPercentage: number;
  categoryBreakdown: CategoryBreakdown[];
}

export interface CategoryBreakdown {
  category: string;
  total: number;
  matched: number;
  missing: string[];
  proficiencyDistribution: {
    beginner: number;
    intermediate: number;
    advanced: number;
  };
}

// Personalized Roadmap types
export interface PersonalizedRoadmapPhase {
  phase: number;
  title: string;
  stage: 'Beginner' | 'Intermediate' | 'Advanced';
  description: string;
  skillsToLearn: string[];
  skillsAlreadyKnown: string[];
  estimatedWeeks: number;
  resources: LearningResource[];
}

export interface PersonalizedRoadmap {
  careerPathId: string;
  careerTitle: string;
  totalWeeks: number;
  totalSkillsToLearn: number;
  totalSkillsKnown: number;
  completionPercentage: number;
  phases: PersonalizedRoadmapPhase[];
}

// Recommendation types
export interface Recommendation {
  _id: string;
  userId: string;
  resumeId: string;
  careerPaths: {
    careerPathId: string;
    title: string;
    matchScore: number;
    skillFitScore: number;
    demandScore: number;
    growthScore: number;
    matchedSkills: string[];
    missingSkills: string[];
    explanation: string;
    cosineSimilarity: number;
    factors: ExplainableFactor[];
  }[];
  skillGap: {
    currentSkills: string[];
    requiredSkills: string[];
    missingSkills: string[];
    matchScore: number;
    gapPercentage: number;
    categoryBreakdown: CategoryBreakdown[];
  };
  generatedAt: string;
  createdAt: string;
}

// Dashboard types
export interface DashboardData {
  stats: {
    resumesUploaded: number;
    skillsIdentified: number;
    careerMatchesFound: number;
    skillGapPercentage: number;
  };
  topSkills: string[];
  topCareerMatches: {
    title: string;
    matchScore: number;
  }[];
  latestResume: {
    id: string;
    filename: string;
    uploadedAt: string;
  } | null;
}

// API response wrapper
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}
